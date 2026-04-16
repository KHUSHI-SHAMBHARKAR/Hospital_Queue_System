const express = require('express');
const { body } = require('express-validator');
const {
  bookAppointment,
  addWalkIn,
  assignDoctor,
  cancelAppointment,
  getMyAppointments,
  getHospitalAppointments,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Patient
router.get('/my', authorize('patient'), getMyAppointments);

router.post('/',
  authorize('patient'),
  [
    body('hospitalId').notEmpty().withMessage('Hospital is required'),
    body('department').notEmpty().withMessage('Department is required'),
  ],
  bookAppointment
);

// Receptionist
router.get('/hospital/:hospitalId', authorize('receptionist', 'doctor'), getHospitalAppointments);
router.post('/walkin', authorize('receptionist'), addWalkIn);
router.patch('/:id/assign-doctor', authorize('receptionist'), assignDoctor);

// Both
router.delete('/:id', authorize('patient', 'receptionist'), cancelAppointment);

module.exports = router;
