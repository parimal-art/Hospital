const express = require('express');
const { createEmployee, getEmployees, getEmployee, updateEmployee, updateStatus, verifyEmployee, resetEmployeePassword, uploadEmployeeDocuments, profilePdf } = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
const employeeUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'qualificationDocument', maxCount: 1 },
  { name: 'experienceDocument', maxCount: 1 },
  { name: 'otherDocument', maxCount: 1 }
]);

router.route('/').get(protect, authorize(ROLES.ADMIN, ROLES.AUDITOR), getEmployees).post(protect, authorize(ROLES.ADMIN), createEmployee);
router.route('/:id').get(protect, getEmployee).put(protect, updateEmployee);
router.patch('/:id/status', protect, authorize(ROLES.ADMIN), updateStatus);
router.patch('/:id/verify', protect, authorize(ROLES.ADMIN), verifyEmployee);
router.patch('/:id/reset-password', protect, authorize(ROLES.ADMIN), resetEmployeePassword);
router.post('/:id/documents', protect, employeeUpload, uploadEmployeeDocuments);
router.get('/:id/profile-pdf', protect, profilePdf);

module.exports = router;
