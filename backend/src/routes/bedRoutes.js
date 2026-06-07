const express = require('express');
const { getBeds, createBed, updateBed, updateStatus } = require('../controllers/bedController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.route('/').get(protect, getBeds).post(protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), createBed);
router.put('/:id', protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), updateBed);
router.patch('/:id/status', protect, authorize(ROLES.ADMIN, ROLES.RECEPTION), updateStatus);
module.exports = router;
