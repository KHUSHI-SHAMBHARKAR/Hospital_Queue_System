const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const queueService = require('../services/queueService');

// @desc  Hospital analytics
// @route GET /api/analytics/hospital/:hospitalId
const getHospitalAnalytics = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const hObjId = new mongoose.Types.ObjectId(hospitalId);
    const { start, end } = queueService.getTodayRange();

    const [total, completed, waiting, cancelled, avgWaitData] = await Promise.all([
      Appointment.countDocuments({ hospital: hObjId, appointmentDate: { $gte: start, $lte: end } }),
      Appointment.countDocuments({ hospital: hObjId, appointmentDate: { $gte: start, $lte: end }, status: 'completed' }),
      Appointment.countDocuments({ hospital: hObjId, appointmentDate: { $gte: start, $lte: end }, status: 'waiting' }),
      Appointment.countDocuments({ hospital: hObjId, appointmentDate: { $gte: start, $lte: end }, status: 'cancelled' }),
      Appointment.aggregate([
        {
          $match: {
            hospital: hObjId,
            status: 'completed',
            actualStartTime: { $exists: true },
            appointmentDate: { $gte: start, $lte: end },
          },
        },
        {
          $project: {
            waitMinutes: { $divide: [{ $subtract: ['$actualStartTime', '$createdAt'] }, 60000] },
          },
        },
        { $group: { _id: null, avgWait: { $avg: '$waitMinutes' } } },
      ]),
    ]);

    // Department breakdown
    const deptBreakdown = await Appointment.aggregate([
      {
        $match: {
          hospital: hObjId,
          appointmentDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          waiting: { $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Doctor stats
    const doctors = await User.find({ hospital: hObjId, role: 'doctor' })
      .select('name specialization department isAvailable avgRating');

    const doctorStats = await Promise.all(
      doctors.map(async (doc) => {
        const queue = await queueService.getDoctorAssignedQueue(doc._id);
        const done = await Appointment.countDocuments({
          doctor: doc._id,
          status: 'completed',
          appointmentDate: { $gte: start, $lte: end },
        });
        return {
          _id: doc._id,
          name: doc.name,
          specialization: doc.specialization,
          department: doc.department,
          isAvailable: doc.isAvailable,
          avgRating: doc.avgRating,
          queueLength: queue.length,
          completedToday: done,
        };
      })
    );

    // 7-day trend
    const weeklyTrend = await Appointment.aggregate([
      {
        $match: {
          hospital: hObjId,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      today: {
        total,
        completed,
        waiting,
        cancelled,
        avgWaitTime: Math.round(avgWaitData[0]?.avgWait || 0),
      },
      deptBreakdown,
      doctors: doctorStats,
      weeklyTrend,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHospitalAnalytics };
