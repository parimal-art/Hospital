const express = require('express');
const { getLedgers, createLedger, getLedger, updateLedger, deleteLedger } = require('../controllers/ledgerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.route('/').get(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.AUDITOR), getLedgers).post(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), createLedger);
router.route('/:id').get(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.AUDITOR), getLedger).put(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), updateLedger).delete(protect, authorize(ROLES.ADMIN), deleteLedger);
module.exports = router;
