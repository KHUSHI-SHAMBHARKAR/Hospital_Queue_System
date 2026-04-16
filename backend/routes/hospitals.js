const express = require('express');
const { getHospitals, getHospital, createHospital } = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getHospitals);
router.get('/:id', getHospital);
router.post('/', protect, createHospital); // admin/demo only

module.exports = router;
