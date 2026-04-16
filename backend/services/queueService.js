const Appointment = require('../models/Appointment');
const User = require('../models/User');

/**
 * queueService — Department-based queue logic
 * Queue key = hospitalId + department + date
 */

const DEPARTMENTS = [
  'Cardiology','Orthopedics','Neurology','General Medicine',
  'Pediatrics','Dermatology','ENT','Gynecology','Ophthalmology','Psychiatry',
];

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Generate next token for a hospital+department (resets daily)
 */
const generateToken = async (hospitalId, department) => {
  const { start, end } = getTodayRange();
  const last = await Appointment.findOne({
    hospital: hospitalId,
    department,
    appointmentDate: { $gte: start, $lte: end },
    status: { $ne: 'cancelled' },
  }).sort({ tokenNumber: -1 });

  return last ? last.tokenNumber + 1 : 1;
};

/**
 * Get the full active queue for a department (emergency first, then token ASC)
 */
const getDepartmentQueue = async (hospitalId, department) => {
  const { start, end } = getTodayRange();

  const queue = await Appointment.find({
    hospital: hospitalId,
    department,
    appointmentDate: { $gte: start, $lte: end },
    status: { $in: ['waiting', 'current'] },
  })
    .populate('patient', 'name phone email')
    .populate('doctor', 'name specialization')
    .sort({ priority: -1, tokenNumber: 1 })
    .lean();

  return queue.map((appt, idx) => ({
    ...appt,
    queuePosition: idx + 1,
    // For walk-ins without user account
    displayName: appt.patient?.name || appt.patientName || 'Walk-in Patient',
    displayPhone: appt.patient?.phone || appt.patientPhone || '',
  }));
};

/**
 * Estimate wait time for a specific token in a department
 * avgTime = average consultation time across available doctors in that department
 */
const estimateWaitTime = async (hospitalId, department, tokenNumber) => {
  const { start, end } = getTodayRange();

  // Find avg consultation time from doctors in this dept
  const doctors = await User.find({
    hospital: hospitalId,
    department,
    role: 'doctor',
    isAvailable: true,
  }).select('avgConsultationTime');

  const avgTime = doctors.length
    ? Math.round(doctors.reduce((s, d) => s + (d.avgConsultationTime || 15), 0) / doctors.length)
    : parseInt(process.env.AVG_CONSULTATION_TIME_MINUTES) || 15;

  const patientsAhead = await Appointment.countDocuments({
    hospital: hospitalId,
    department,
    appointmentDate: { $gte: start, $lte: end },
    status: { $in: ['waiting', 'current'] },
    $or: [
      { priority: 'emergency' },
      { tokenNumber: { $lt: tokenNumber } },
    ],
  });

  return patientsAhead * avgTime;
};

/**
 * Recalculate + bulk-update all queue positions and wait times for a department
 */
const recalculateDepartmentQueue = async (hospitalId, department) => {
  const queue = await getDepartmentQueue(hospitalId, department);
  const doctors = await User.find({
    hospital: hospitalId, department, role: 'doctor', isAvailable: true,
  }).select('avgConsultationTime');
  const avgTime = doctors.length
    ? Math.round(doctors.reduce((s, d) => s + (d.avgConsultationTime || 15), 0) / doctors.length)
    : 15;

  if (queue.length > 0) {
    const updates = queue.map((appt, idx) => ({
      updateOne: {
        filter: { _id: appt._id },
        update: { queuePosition: idx + 1, estimatedWaitTime: idx * avgTime },
      },
    }));
    await Appointment.bulkWrite(updates);
  }

  return queue;
};

/**
 * Receptionist calls next patient in a department
 * Marks current → completed, next waiting → current
 */
const callNextInDepartment = async (hospitalId, department) => {
  const { start, end } = getTodayRange();

  // Complete current
  await Appointment.updateMany(
    { hospital: hospitalId, department, status: 'current', appointmentDate: { $gte: start, $lte: end } },
    { status: 'completed', completedAt: new Date() }
  );

  // Find next waiting (emergency priority first, then token order)
  const next = await Appointment.findOne({
    hospital: hospitalId,
    department,
    appointmentDate: { $gte: start, $lte: end },
    status: 'waiting',
  })
    .sort({ priority: -1, tokenNumber: 1 })
    .populate('patient', 'name phone email')
    .populate('doctor', 'name specialization');

  if (!next) return null;

  next.status = 'current';
  next.actualStartTime = new Date();
  await next.save();

  return next;
};

/**
 * Doctor calls next from their own assigned list
 */
const callNextForDoctor = async (doctorId) => {
  const { start, end } = getTodayRange();

  await Appointment.updateMany(
    { doctor: doctorId, status: 'current', appointmentDate: { $gte: start, $lte: end } },
    { status: 'completed', completedAt: new Date() }
  );

  const next = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: { $gte: start, $lte: end },
    status: 'waiting',
  })
    .sort({ priority: -1, tokenNumber: 1 })
    .populate('patient', 'name phone email');

  if (!next) return null;
  next.status = 'current';
  next.actualStartTime = new Date();
  await next.save();

  return next;
};

/**
 * Get all appointments assigned to a specific doctor today
 */
const getDoctorAssignedQueue = async (doctorId) => {
  const { start, end } = getTodayRange();
  const queue = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: start, $lte: end },
    status: { $in: ['waiting', 'current'] },
  })
    .populate('patient', 'name phone email')
    .sort({ priority: -1, tokenNumber: 1 })
    .lean();

  return queue.map((a, idx) => ({
    ...a,
    queuePosition: idx + 1,
    displayName: a.patient?.name || a.patientName || 'Walk-in',
    displayPhone: a.patient?.phone || a.patientPhone || '',
  }));
};

/**
 * Send near-turn notifications (2 patients ahead) for a department
 */
const checkNearTurnAlerts = async (hospitalId, department, io) => {
  const queue = await getDepartmentQueue(hospitalId, department);
  const threshold = parseInt(process.env.NEAR_TURN_ALERT_THRESHOLD) || 2;

  for (const appt of queue) {
    if (appt.queuePosition === threshold + 1 && !appt.notifiedAt && appt.patient?._id) {
      io.to(`patient_${appt.patient._id}`).emit('near_turn_alert', {
        message: `Your turn is coming! ${threshold} patients ahead of you in ${department}.`,
        appointment: appt,
        patientsAhead: threshold,
        department,
      });
      await Appointment.findByIdAndUpdate(appt._id, { notifiedAt: new Date() });
      console.log(`📢 Near-turn alert → ${appt.displayName} (${department})`);
    }
  }
};

/**
 * Mark appointment as emergency — moves to top of queue
 */
const markEmergency = async (appointmentId) => {
  const appt = await Appointment.findById(appointmentId)
    .populate('patient', 'name phone email');
  if (!appt) throw new Error('Appointment not found');
  appt.priority = 'emergency';
  appt.status = 'waiting';
  await appt.save();
  return appt;
};

module.exports = {
  DEPARTMENTS,
  getTodayRange,
  generateToken,
  getDepartmentQueue,
  getDoctorAssignedQueue,
  estimateWaitTime,
  recalculateDepartmentQueue,
  callNextInDepartment,
  callNextForDoctor,
  checkNearTurnAlerts,
  markEmergency,
};
