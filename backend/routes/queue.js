const express = require('express');
const {
  getDepartmentQueue,
  getMyDoctorQueue,
  callNextInDept,
  callNextForDoctor,
  updateStatus,
  markEmergency,
  toggleAvailability,
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// View dept queue (patient, receptionist, doctor)
router.get('/department/:hospitalId/:department', getDepartmentQueue);

// Doctor: own assigned queue
router.get('/doctor/me', authorize('doctor'), getMyDoctorQueue);

// Receptionist: call next in department
router.patch('/next/:hospitalId/:department', authorize('receptionist', 'doctor'), callNextInDept);

// Doctor: call next in their list
router.patch('/doctor/next', authorize('doctor'), callNextForDoctor);

// Shared: update status / emergency / availability
router.patch('/appointment/:id/status', authorize('doctor', 'receptionist'), updateStatus);
router.patch('/appointment/:id/emergency', authorize('doctor', 'receptionist'), markEmergency);
router.patch('/availability', authorize('doctor'), toggleAvailability);

module.exports = router;
