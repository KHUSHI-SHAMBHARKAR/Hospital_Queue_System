const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['patient', 'receptionist', 'doctor'],
    default: 'patient',
  },
  phone: { type: String, trim: true },

  // ── Doctor-specific ──────────────────────────────────────────────────────────
  specialization: { type: String, trim: true },
  department: {
    type: String,
    trim: true,
    enum: [
      'Cardiology','Orthopedics','Neurology','General Medicine',
      'Pediatrics','Dermatology','ENT','Gynecology','Ophthalmology','Psychiatry', '',
    ],
  },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  isAvailable: { type: Boolean, default: true },
  avgConsultationTime: { type: Number, default: 15 }, // minutes
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  // ── Patient-specific ─────────────────────────────────────────────────────────
  location: {
    lat: Number,
    lng: Number,
    city: String,
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
