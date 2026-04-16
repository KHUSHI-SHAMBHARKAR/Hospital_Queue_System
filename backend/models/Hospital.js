const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
  },
  address: {
    street: String,
    city: { type: String, required: true },
    state: String,
    pincode: String,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  phone: String,
  email: String,
  departments: [String],
  isActive: { type: Boolean, default: true },
  totalPatients: { type: Number, default: 0 },
}, { timestamps: true });

// Geospatial index for nearby queries
hospitalSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
