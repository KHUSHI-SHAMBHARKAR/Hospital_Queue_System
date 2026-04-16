const Hospital = require('../models/Hospital');
const User = require('../models/User');

// @desc    Get all hospitals (with optional nearby filtering)
// @route   GET /api/hospitals
// @access  Public
const getHospitals = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, search } = req.query;

    let hospitals = await Hospital.find({ isActive: true });

    // Basic distance filter (Haversine approximation)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const R = 6371; // Earth radius in km

      hospitals = hospitals.filter((h) => {
        const dLat = ((h.location.lat - userLat) * Math.PI) / 180;
        const dLng = ((h.location.lng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLat * Math.PI) / 180) *
          Math.cos((h.location.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        h._doc.distance = Math.round(distance * 10) / 10;
        return distance <= parseFloat(radius);
      }).sort((a, b) => a._doc.distance - b._doc.distance);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      hospitals = hospitals.filter((h) => regex.test(h.name) || regex.test(h.address?.city));
    }

    // Get doctor counts per hospital
    const enriched = await Promise.all(hospitals.map(async (h) => {
      const doctorCount = await User.countDocuments({ hospital: h._id, role: 'doctor', isAvailable: true });
      return { ...h._doc, availableDoctors: doctorCount };
    }));

    res.json({ success: true, count: enriched.length, hospitals: enriched });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hospital with its doctors
// @route   GET /api/hospitals/:id
// @access  Public
const getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const doctors = await User.find({ hospital: hospital._id, role: 'doctor' })
      .select('name specialization isAvailable avgRating avgConsultationTime');

    res.json({ success: true, hospital, doctors });
  } catch (error) {
    next(error);
  }
};

// @desc    Create hospital
// @route   POST /api/hospitals
// @access  Admin / Demo
const createHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success: true, hospital });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHospitals, getHospital, createHospital };
