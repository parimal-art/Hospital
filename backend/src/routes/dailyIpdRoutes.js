const express = require('express');
const { getEntries, createEntry, getEntry, updateEntry, deleteEntry } = require('../controllers/dailyIpdController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.route('/').get(protect, getEntries).post(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.NURSE), upload.array('attachments', 5), createEntry);
router.route('/:id').get(protect, getEntry).put(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.NURSE), upload.array('attachments', 5), updateEntry).delete(protect, authorize(ROLES.ADMIN), deleteEntry);
module.exports = router;
