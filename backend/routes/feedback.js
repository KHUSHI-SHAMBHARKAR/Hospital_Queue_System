const express = require('express');
const { submitFeedback, getDoctorFeedback } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/doctor/:doctorId', getDoctorFeedback);
router.post('/', protect, authorize('patient'), submitFeedback);

module.exports = router;
