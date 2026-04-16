const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const queueService = require('../services/queueService');
const notification = require('../services/notificationService');
const {
  emitDeptQueueUpdate,
  emitToHospital,
  emitDoctorAssigned,
  emitDoctorQueueUpdate,
} = require('../socket/socketHandler');

// ── Helper: resolve display name for an appointment ───────────────────────────
const resolveDisplayName = (appt) =>
  appt.patient?.name || appt.patientName || 'Walk-in Patient';

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Book appointment (PATIENT — no doctor selection)
// @route POST /api/appointments
// @body  { hospitalId, department, symptoms }
// ─────────────────────────────────────────────────────────────────────────────
const bookAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    let { hospitalId, department, symptoms } = req.body;
    // Normalize hospitalId if a populated object was passed from the client
    if (hospitalId && typeof hospitalId === 'object' && hospitalId._id) hospitalId = hospitalId._id;
    const io = req.app.get('io');

    // Prevent duplicate active appointment in same dept today
    const { start, end } = queueService.getTodayRange();
    const existing = await Appointment.findOne({
      patient: req.user._id,
      hospital: hospitalId,
      department,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'current'] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You already have an active token (#${existing.tokenNumber}) in ${department}.`,
      });
    }

    const tokenNumber = await queueService.generateToken(hospitalId, department);
    const estimatedWait = await queueService.estimateWaitTime(hospitalId, department, tokenNumber);

    const appointment = await Appointment.create({
      patient: req.user._id,
      hospital: hospitalId,
      department,
      symptoms,
      tokenNumber,
      estimatedWaitTime: estimatedWait,
      appointmentDate: new Date(),
      status: 'waiting',
    });

    await appointment.populate([
      { path: 'patient', select: 'name phone email' },
      { path: 'hospital', select: 'name address' },
    ]);

    // Send SMS token to patient (best-effort)
    try { notification.sendAppointmentToken(appointment) } catch (e) { console.error('SMS error', e) }

    // Real-time: notify department watchers and hospital receptionists
    const updatedQueue = await queueService.getDepartmentQueue(hospitalId, department);
    emitDeptQueueUpdate(io, hospitalId, department, updatedQueue);
    emitToHospital(io, hospitalId, 'new_appointment', { appointment, department });

    res.status(201).json({
      success: true,
      message: `Appointment booked! Your token is #${tokenNumber}`,
      appointment,
      queue: updatedQueue,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Walk-in patient (RECEPTIONIST)
// @route POST /api/appointments/walkin
// @body  { hospitalId, department, patientName, patientPhone, symptoms, doctorId? }
// ─────────────────────────────────────────────────────────────────────────────
const addWalkIn = async (req, res, next) => {
  try {
    let { hospitalId, department, patientName, patientPhone, symptoms, doctorId } = req.body;
    // Normalize hospitalId if a populated object was passed from the client
    if (hospitalId && typeof hospitalId === 'object' && hospitalId._id) hospitalId = hospitalId._id;
    const io = req.app.get('io');

    if (!hospitalId || !department || !patientName) {
      return res.status(400).json({ success: false, message: 'hospitalId, department and patientName are required' });
    }

    // Try to find existing user by phone
    let patientRef = null;
    if (patientPhone) {
      patientRef = await User.findOne({ phone: patientPhone, role: 'patient' }).select('_id name');
    }

    const tokenNumber = await queueService.generateToken(hospitalId, department);
    const estimatedWait = await queueService.estimateWaitTime(hospitalId, department, tokenNumber);

    const apptData = {
      hospital: hospitalId,
      department,
      symptoms,
      tokenNumber,
      estimatedWaitTime: estimatedWait,
      appointmentDate: new Date(),
      status: 'waiting',
      isWalkIn: true,
      patientName,
      patientPhone,
    };

    if (patientRef) apptData.patient = patientRef._id;
    if (doctorId) apptData.doctor = doctorId;

    const appointment = await Appointment.create(apptData);
    await appointment.populate([
      { path: 'patient', select: 'name phone' },
      { path: 'doctor', select: 'name specialization' },
      { path: 'hospital', select: 'name' },
    ]);

    // Send SMS token to patient (best-effort)
    try { notification.sendAppointmentToken(appointment) } catch (e) { console.error('SMS error', e) }

    const updatedQueue = await queueService.getDepartmentQueue(hospitalId, department);
    emitDeptQueueUpdate(io, hospitalId, department, updatedQueue);
    emitToHospital(io, hospitalId, 'new_appointment', { appointment, department });

    if (doctorId) {
      const doctorQueue = await queueService.getDoctorAssignedQueue(doctorId);
      emitDoctorQueueUpdate(io, doctorId, doctorQueue);
    }

    res.status(201).json({ success: true, appointment, queue: updatedQueue });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Assign doctor to appointment (RECEPTIONIST)
// @route PATCH /api/appointments/:id/assign-doctor
// @body  { doctorId }
// ─────────────────────────────────────────────────────────────────────────────
const assignDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    const io = req.app.get('io');

    if (!doctorId) return res.status(400).json({ success: false, message: 'doctorId is required' });

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot assign doctor to a finished appointment' });
    }

    appointment.doctor = doctorId;
    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'name phone email' },
      { path: 'doctor', select: 'name specialization department' },
      { path: 'hospital', select: 'name' },
    ]);

    // Notify doctor
    emitDoctorAssigned(io, doctorId, appointment);
    const doctorQueue = await queueService.getDoctorAssignedQueue(doctorId);
    emitDoctorQueueUpdate(io, doctorId, doctorQueue);

    // Also refresh department queue — ensure we pass an ObjectId/string id
    const hospitalIdForEmit = appointment.hospital && appointment.hospital._id
      ? appointment.hospital._id.toString()
      : appointment.hospital?.toString();
    const deptQueue = await queueService.getDepartmentQueue(
      hospitalIdForEmit,
      appointment.department
    );
    emitDeptQueueUpdate(io, hospitalIdForEmit, appointment.department, deptQueue);

    // Notify patient about doctor assignment via SMS
    try {
      notification.sendSms(
        appointment.patient?.phone || appointment.patientPhone,
        `You have been assigned to Dr. ${doctor.name}. Token #${appointment.tokenNumber}`
      )
    } catch (e) { console.error('SMS assign error', e) }

    res.json({ success: true, message: `Dr. ${doctor.name} assigned`, appointment });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Cancel appointment
// @route DELETE /api/appointments/:id
// ─────────────────────────────────────────────────────────────────────────────
const cancelAppointment = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (req.user.role === 'patient') {
      const isOwner =
        appointment.patient?.toString() === req.user._id.toString();
      if (!isOwner)
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Already ${appointment.status}` });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const updatedQueue = await queueService.getDepartmentQueue(
      appointment.hospital.toString(),
      appointment.department
    );
    emitDeptQueueUpdate(io, appointment.hospital.toString(), appointment.department, updatedQueue);

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get patient's own appointments
// @route GET /api/appointments/my
// ─────────────────────────────────────────────────────────────────────────────
const getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { patient: req.user._id };
    if (status) filter.status = status;

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization avgRating')
      .populate('hospital', 'name address')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const enriched = await Promise.all(
      appointments.map(async (appt) => {
        const a = appt.toObject();
        if (a.status === 'waiting') {
          a.estimatedWaitTime = await queueService.estimateWaitTime(
            a.hospital._id, a.department, a.tokenNumber
          );
          const { start, end } = queueService.getTodayRange();
          a.patientsAhead = await Appointment.countDocuments({
            hospital: a.hospital._id,
            department: a.department,
            appointmentDate: { $gte: start, $lte: end },
            status: { $in: ['waiting', 'current'] },
            $or: [{ priority: 'emergency' }, { tokenNumber: { $lt: a.tokenNumber } }],
          });
        }
        return a;
      })
    );

    res.json({ success: true, total, page: parseInt(page), appointments: enriched });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get appointments for a hospital (receptionist view)
// @route GET /api/appointments/hospital/:hospitalId
// ─────────────────────────────────────────────────────────────────────────────
const getHospitalAppointments = async (req, res, next) => {
  try {
    const { status, department, doctorId, date } = req.query;
    const filter = { hospital: req.params.hospitalId };
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (doctorId) filter.doctor = doctorId;

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const e = new Date(date);
      e.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: d, $lte: e };
    } else {
      const { start, end } = queueService.getTodayRange();
      filter.appointmentDate = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name phone email')
      .populate('doctor', 'name specialization')
      .sort({ priority: -1, tokenNumber: 1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bookAppointment,
  addWalkIn,
  assignDoctor,
  cancelAppointment,
  getMyAppointments,
  getHospitalAppointments,
};
