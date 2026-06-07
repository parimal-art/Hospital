const express = require('express');
const { getDoctors, createDoctor, getDoctor, updateDoctor, getDoctorPatients, calculateDoctorWages } = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.route('/').get(protect, getDoctors).post(protect, authorize(ROLES.ADMIN), createDoctor);
router.route('/:id').get(protect, getDoctor).put(protect, authorize(ROLES.ADMIN), updateDoctor);
router.get('/:id/patients', protect, getDoctorPatients);
router.get('/:id/wages', protect, calculateDoctorWages);
module.exports = router;
