const express = require('express');
const { getPatients, createPatient, getPatient, updatePatient, getTimeline } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
const allClinical = [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE, ROLES.MEDICAL_STORE, ROLES.AUDITOR];
router.route('/').get(protect, authorize(...allClinical), getPatients).post(protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), createPatient);
router.route('/:id').get(protect, authorize(...allClinical), getPatient).put(protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), updatePatient);
router.get('/:id/timeline', protect, authorize(...allClinical), getTimeline);
module.exports = router;
