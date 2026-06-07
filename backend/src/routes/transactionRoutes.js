const express = require('express');
const { getTransactions, createTransaction, getTransaction, updateTransaction, cancelTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.route('/').get(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.AUDITOR), getTransactions).post(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), createTransaction);
router.route('/:id').get(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.AUDITOR), getTransaction).put(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), updateTransaction);
router.patch('/:id/cancel', protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), cancelTransaction);
module.exports = router;
