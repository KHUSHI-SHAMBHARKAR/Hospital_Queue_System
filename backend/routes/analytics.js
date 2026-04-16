const express = require('express');
const { getHospitalAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/hospital/:hospitalId', authorize('receptionist', 'doctor'), getHospitalAnalytics);

module.exports = router;
