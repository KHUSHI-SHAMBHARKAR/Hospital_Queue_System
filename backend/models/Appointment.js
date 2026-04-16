const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  patientName: { type: String, trim: true },
  patientPhone: { type: String, trim: true },

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital is required'],
  },

  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    enum: [
      'Cardiology','Orthopedics','Neurology','General Medicine',
      'Pediatrics','Dermatology','ENT','Gynecology','Ophthalmology','Psychiatry',
    ],
  },

  // Assigned LATER by receptionist
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  symptoms: { type: String, trim: true, maxlength: 500 },
  tokenNumber: { type: Number, required: true },
  queuePosition: { type: Number, default: null },

  status: {
    type: String,
    enum: ['waiting', 'current', 'completed', 'cancelled', 'skipped'],
    default: 'waiting',
  },
  priority: {
    type: String,
    enum: ['normal', 'emergency'],
    default: 'normal',
  },

  isWalkIn: { type: Boolean, default: false },
  appointmentDate: { type: Date, default: Date.now },
  estimatedWaitTime: { type: Number, default: 0 },
  actualStartTime: Date,
  completedAt: Date,
  notifiedAt: Date,
  feedback: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
}, { timestamps: true });

appointmentSchema.index({ hospital: 1, department: 1, status: 1, tokenNumber: 1 });
appointmentSchema.index({ doctor: 1, status: 1, appointmentDate: 1 });
appointmentSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
