const Appointment = require('../models/Appointment');
const User = require('../models/User');
const queueService = require('../services/queueService');
const {
  emitDeptQueueUpdate,
  emitDoctorQueueUpdate,
  emitPatientCalled,
  emitToHospital,
} = require('../socket/socketHandler');

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get department queue
// @route GET /api/queue/department/:hospitalId/:department
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
const getDepartmentQueue = async (req, res, next) => {
  try {
    const { hospitalId, department } = req.params;
    const queue = await queueService.getDepartmentQueue(hospitalId, department);
    const doctors = await User.find({
      hospital: hospitalId, department, role: 'doctor',
    }).select('name specialization isAvailable avgConsultationTime avgRating');

    res.json({ success: true, department, queue, count: queue.length, doctors });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get doctor's own assigned queue
// @route GET /api/queue/doctor/me
// @access Doctor
// ─────────────────────────────────────────────────────────────────────────────
const getMyDoctorQueue = async (req, res, next) => {
  try {
    const queue = await queueService.getDoctorAssignedQueue(req.user._id);
    res.json({ success: true, queue, count: queue.length });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Receptionist calls next patient in a department
// @route PATCH /api/queue/next/:hospitalId/:department
// @access Receptionist
// ─────────────────────────────────────────────────────────────────────────────
const callNextInDept = async (req, res, next) => {
  try {
    const { hospitalId, department } = req.params;
    const io = req.app.get('io');

    const next = await queueService.callNextInDepartment(hospitalId, department);

    if (!next) {
      return res.json({ success: true, message: 'No more patients in queue', next: null });
    }

    const updatedQueue = await queueService.getDepartmentQueue(hospitalId, department);
    emitDeptQueueUpdate(io, hospitalId, department, updatedQueue);
    emitPatientCalled(io, hospitalId, department, next);
    await queueService.checkNearTurnAlerts(hospitalId, department, io);

    res.json({ success: true, next, queue: updatedQueue });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Doctor calls their next assigned patient
// @route PATCH /api/queue/doctor/next
// @access Doctor
// ─────────────────────────────────────────────────────────────────────────────
const callNextForDoctor = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const doctorId = req.user._id.toString();
    const doctor = await User.findById(doctorId).select('hospital department');

    const nextPatient = await queueService.callNextForDoctor(doctorId);

    if (!nextPatient) {
      return res.json({ success: true, message: 'Your queue is empty', next: null });
    }

    const doctorQueue = await queueService.getDoctorAssignedQueue(doctorId);
    emitDoctorQueueUpdate(io, doctorId, doctorQueue);

    // Also refresh department queue for watchers
    if (doctor?.hospital && doctor?.department) {
      const deptQueue = await queueService.getDepartmentQueue(doctor.hospital.toString(), doctor.department);
      emitDeptQueueUpdate(io, doctor.hospital.toString(), doctor.department, deptQueue);
    }

    res.json({ success: true, next: nextPatient, queue: doctorQueue });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update appointment status (doctor or receptionist)
// @route PATCH /api/queue/appointment/:id/status
// @body  { status: 'waiting'|'current'|'completed'|'skipped' }
// ─────────────────────────────────────────────────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const io = req.app.get('io');
    const allowed = ['waiting', 'current', 'completed', 'skipped', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name phone email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Doctor can only update their own patients
    if (req.user.role === 'doctor' && appointment.doctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your patient' });
    }

    appointment.status = status;
    if (status === 'current') appointment.actualStartTime = new Date();
    if (status === 'completed') appointment.completedAt = new Date();
    await appointment.save();

    // Refresh both department queue and doctor queue
    const hospitalId = appointment.hospital.toString();
    const deptQueue = await queueService.getDepartmentQueue(hospitalId, appointment.department);
    emitDeptQueueUpdate(io, hospitalId, appointment.department, deptQueue);

    if (appointment.doctor) {
      const doctorQueue = await queueService.getDoctorAssignedQueue(appointment.doctor);
      emitDoctorQueueUpdate(io, appointment.doctor.toString(), doctorQueue);
    }

    await queueService.checkNearTurnAlerts(hospitalId, appointment.department, io);

    res.json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Mark appointment as emergency
// @route PATCH /api/queue/appointment/:id/emergency
// ─────────────────────────────────────────────────────────────────────────────
const markEmergency = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const appointment = await queueService.markEmergency(req.params.id);

    const hospitalId = appointment.hospital.toString();
    const updatedQueue = await queueService.getDepartmentQueue(hospitalId, appointment.department);
    emitDeptQueueUpdate(io, hospitalId, appointment.department, updatedQueue);

    // Broadcast emergency alert to dept room
    io.to(`department_${hospitalId}_${appointment.department}`).emit('emergency_alert', {
      message: `Emergency patient in ${appointment.department}`,
      appointment,
    });

    res.json({ success: true, appointment, queue: updatedQueue });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Toggle doctor availability
// @route PATCH /api/queue/availability
// @access Doctor
// ─────────────────────────────────────────────────────────────────────────────
const toggleAvailability = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const doctor = await User.findById(req.user._id);
    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();

    if (doctor.hospital && doctor.department) {
      io.to(`department_${doctor.hospital}_${doctor.department}`).emit('doctor_availability_changed', {
        doctorId: doctor._id,
        isAvailable: doctor.isAvailable,
        name: doctor.name,
      });
    }

    res.json({ success: true, isAvailable: doctor.isAvailable });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDepartmentQueue,
  getMyDoctorQueue,
  callNextInDept,
  callNextForDoctor,
  updateStatus,
  markEmergency,
  toggleAvailability,
};
