const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/doctors?hospitalId=&department=&available=true
router.get('/', async (req, res, next) => {
  try {
    const { hospitalId, department, available } = req.query;
    const filter = { role: 'doctor' };
    if (hospitalId)  filter.hospital    = hospitalId;
    if (department)  filter.department  = department;
    if (available === 'true') filter.isAvailable = true;

    const doctors = await User.find(filter)
      .select('name specialization department isAvailable avgRating avgConsultationTime hospital totalRatings')
      .populate('hospital', 'name');

    res.json({ success: true, doctors });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
      .select('-password')
      .populate('hospital', 'name address');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
