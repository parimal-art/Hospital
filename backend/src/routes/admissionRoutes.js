const express = require('express');
const { getAdmissions, createAdmission, getAdmission, updateAdmission, dischargeRequest, discharge } = require('../controllers/admissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.route('/').get(protect, getAdmissions).post(protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), createAdmission);
router.route('/:id').get(protect, getAdmission).put(protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), updateAdmission);
router.patch('/:id/discharge-request', protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), dischargeRequest);
router.patch('/:id/discharge', protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), discharge);
module.exports = router;
