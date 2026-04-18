const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Patient
const submitFeedback = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment, waitTimeRating } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (!appointment.patient || appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }

    if (!(appointment.status === 'completed' || appointment.completedAt)) {
      return res.status(400).json({ success: false, message: 'Can only rate completed appointments' });
    }

    if (appointment.feedback) {
      return res.status(409).json({ success: false, message: 'Feedback already submitted' });
    }

    const feedback = await Feedback.create({
      patient: req.user._id,
      doctor: appointment.doctor,
      appointment: appointmentId,
      rating,
      comment,
      waitTimeRating,
    });

    appointment.feedback = feedback._id;
    await appointment.save();

    // Update doctor's average rating
    const allFeedback = await Feedback.find({ doctor: appointment.doctor });
    const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
    await User.findByIdAndUpdate(appointment.doctor, {
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: allFeedback.length,
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feedback for a doctor
// @route   GET /api/feedback/doctor/:doctorId
// @access  Public
const getDoctorFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ doctor: req.params.doctorId })
      .populate('patient', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    const avg = feedback.length
      ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length
      : 0;

    res.json({ success: true, avgRating: Math.round(avg * 10) / 10, count: feedback.length, feedback });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitFeedback, getDoctorFeedback };
