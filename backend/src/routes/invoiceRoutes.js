const express = require('express');
const { getInvoices, createInvoice, getInvoice, updateInvoice, cancelInvoice, printInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.route('/').get(protect, getInvoices).post(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), createInvoice);
router.route('/:id').get(protect, getInvoice).put(protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), updateInvoice);
router.patch('/:id/cancel', protect, authorize(ROLES.ADMIN, ROLES.ACCOUNTS), cancelInvoice);
router.get('/:id/print', protect, printInvoice);
module.exports = router;
