const express = require('express');
const {
  getDashboard,
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  addStock,
  createSale,
  getSales,
  getSale,
  cancelSale,
  getStockBills,
  getStockBill,
  getCompositionAvailability
} = require('../controllers/medicalStoreController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

const readRoles = [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.MEDICAL_STORE, ROLES.AUDITOR];
const writeRoles = [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.MEDICAL_STORE];

router.get('/dashboard', protect, authorize(...readRoles), getDashboard);
router.get('/compositions', protect, authorize(...readRoles), getCompositionAvailability);
router.get('/stock-bills', protect, authorize(...readRoles), getStockBills);
router.get('/stock-bills/:id', protect, authorize(...readRoles), getStockBill);

router.route('/medicines')
  .get(protect, authorize(...readRoles), getMedicines)
  .post(protect, authorize(...writeRoles), createMedicine);

router.route('/medicines/:id')
  .get(protect, authorize(...readRoles), getMedicine)
  .put(protect, authorize(...writeRoles), updateMedicine);

router.patch('/medicines/:id/stock', protect, authorize(...writeRoles), addStock);

router.route('/sales')
  .get(protect, authorize(...readRoles), getSales)
  .post(protect, authorize(...writeRoles), createSale);

router.route('/sales/:id')
  .get(protect, authorize(...readRoles), getSale);

router.patch('/sales/:id/cancel', protect, authorize(...writeRoles), cancelSale);

module.exports = router;