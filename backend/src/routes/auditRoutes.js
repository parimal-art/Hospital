const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.AUDITOR), getAuditLogs);
module.exports = router;
