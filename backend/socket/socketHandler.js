const jwt = require('jsonwebtoken');
const User = require('../models/User');

const connectedUsers = new Map();

// ── Room naming helpers ────────────────────────────────────────────────────────
const deptRoom      = (hospitalId, dept) => `department_${hospitalId}_${dept}`;
const patientRoom   = (userId)          => `patient_${userId}`;
const doctorRoom    = (doctorId)        => `doctor_${doctorId}`;
const hospitalRoom  = (hospitalId)      => `hospital_${hospitalId}`;

const initSocket = (io) => {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    connectedUsers.set(user._id.toString(), socket.id);
    console.log(`🔌 ${user.name} [${user.role}] connected (${socket.id})`);

    // Role rooms
    socket.join(`role_${user.role}`);

    if (user.role === 'patient') {
      socket.join(patientRoom(user._id));
    }

    if (user.role === 'doctor') {
      socket.join(doctorRoom(user._id));
      // Auto-join their department room
      if (user.hospital && user.department) {
        socket.join(deptRoom(user.hospital, user.department));
      }
    }

    if (user.role === 'receptionist' && user.hospital) {
      socket.join(hospitalRoom(user.hospital));
    }

    // ── Client-emitted room joins ─────────────────────────────────────────────
    // Patient/anyone watching a department queue
    socket.on('join_department_room', ({ hospitalId, department }) => {
      const room = deptRoom(hospitalId, department);
      socket.join(room);
      console.log(`📺 ${user.name} joined dept room: ${room}`);
    });

    socket.on('leave_department_room', ({ hospitalId, department }) => {
      socket.leave(deptRoom(hospitalId, department));
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(user._id.toString());
      console.log(`❌ ${user.name} disconnected`);
    });
  });
};

// ── Emit helpers ──────────────────────────────────────────────────────────────

/** Broadcast queue update to everyone watching a department */
const emitDeptQueueUpdate = (io, hospitalId, department, queue) => {
  io.to(deptRoom(hospitalId, department)).emit('queue_updated', {
    hospitalId,
    department,
    queue,
    timestamp: new Date(),
  });
};

/** Notify a specific doctor of their assigned queue change */
const emitDoctorQueueUpdate = (io, doctorId, queue) => {
  io.to(doctorRoom(doctorId)).emit('doctor_queue_updated', {
    doctorId,
    queue,
    timestamp: new Date(),
  });
};

/** Notify doctor when a patient is assigned to them */
const emitDoctorAssigned = (io, doctorId, appointment) => {
  io.to(doctorRoom(doctorId)).emit('doctor_assigned', { appointment });
};

/** Notify all receptionists in a hospital */
const emitToHospital = (io, hospitalId, event, data) => {
  io.to(hospitalRoom(hospitalId)).emit(event, data);
};

/** Broadcast patient_called to everyone in the department room */
const emitPatientCalled = (io, hospitalId, department, appointment) => {
  io.to(deptRoom(hospitalId, department)).emit('patient_called', {
    appointment,
    department,
    timestamp: new Date(),
  });
};

module.exports = {
  initSocket,
  emitDeptQueueUpdate,
  emitDoctorQueueUpdate,
  emitDoctorAssigned,
  emitToHospital,
  emitPatientCalled,
  deptRoom,
  patientRoom,
  doctorRoom,
};
