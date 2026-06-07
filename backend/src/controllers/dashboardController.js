const User = require('../models/User');
const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const Doctor = require('../models/Doctor');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Medicine = require('../models/Medicine');
const MedicineSale = require('../models/MedicineSale');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

const getStockPriority = (medicine) => {
  const stock = Number(medicine.stockQty || 0);
  const reorderLevel = Number(medicine.reorderLevel || 10);
  if (stock <= 0) return { label: 'Immediate', rank: 1, reason: 'Out of stock' };
  if (stock < 5) return { label: 'High', rank: 2, reason: 'Less than 5 in stock' };
  if (stock < 10) return { label: 'Medium', rank: 3, reason: 'Less than 10 in stock' };
  if (stock <= reorderLevel) return { label: 'Low', rank: 4, reason: `Below reorder level (${reorderLevel})` };
  return { label: 'OK', rank: 99, reason: 'Sufficient stock' };
};

const decorateMedicine = (medicine) => {
  const obj = medicine.toObject ? medicine.toObject() : { ...medicine };
  obj.stockPriority = getStockPriority(obj);
  return obj;
};

const dashboard = asyncHandler(async (req, res) => {
  const todayRange = { $gte: startOfToday(), $lte: endOfToday() };
  const [
    employees,
    patients,
    currentIpd,
    todayAdmissions,
    todayDischarges,
    doctors,
    beds,
    verificationPending,
    recentPayments,
    recentInvoices,
    dailyPending,
    medicines,
    recentMedicineSales,
    todayMedicineSalesAgg
  ] = await Promise.all([
    User.countDocuments(),
    Patient.countDocuments(),
    Admission.countDocuments({ status: { $in: ['Admitted', 'Under Treatment', 'Discharge Requested'] } }),
    Admission.countDocuments({ admissionDateTime: todayRange }),
    Admission.countDocuments({ dischargeDateTime: todayRange }),
    Doctor.countDocuments({ status: 'Active' }),
    Bed.find(),
    User.countDocuments({ verificationStatus: { $in: ['Document Pending', 'Verification Pending', 'New Employee'] } }),
    Transaction.find({ status: 'Posted' }).populate('ledger patient doctor').sort({ createdAt: -1 }).limit(8),
    Invoice.find().populate('patient').sort({ createdAt: -1 }).limit(8),
    Admission.countDocuments({ status: { $in: ['Admitted', 'Under Treatment'] } }),
    Medicine.find({ status: 'Active' }),
    MedicineSale.find().populate('patient admission').sort({ createdAt: -1 }).limit(8),
    MedicineSale.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, date: todayRange } },
      { $group: { _id: null, amount: { $sum: '$total' }, count: { $sum: 1 } } }
    ])
  ]);

  const todayRevenueAgg = await Transaction.aggregate([
    { $match: { voucherType: 'Receipt', status: 'Posted', date: todayRange } },
    { $group: { _id: null, amount: { $sum: '$amount' } } }
  ]);
  const pendingAgg = await Invoice.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, amount: { $sum: '$balanceAmount' } } }]);
  const bedSummary = beds.reduce((acc, bed) => { acc[bed.status] = (acc[bed.status] || 0) + 1; return acc; }, {});

  const decoratedMedicines = medicines.map(decorateMedicine);
  const lowStockMedicines = decoratedMedicines
    .filter((medicine) => medicine.stockPriority.rank < 99)
    .sort((a, b) => a.stockPriority.rank - b.stockPriority.rank || Number(a.stockQty || 0) - Number(b.stockQty || 0))
    .slice(0, 8);

  const medicalStoreTotals = decoratedMedicines.reduce((acc, medicine) => {
    acc.totalMedicines += 1;
    acc.totalStockQty += Number(medicine.stockQty || 0);
    acc.inventoryValue += Number(medicine.stockQty || 0) * Number(medicine.purchaseRate || 0);
    if (Number(medicine.stockQty || 0) <= 0) acc.outOfStock += 1;
    if (Number(medicine.stockQty || 0) > 0 && Number(medicine.stockQty || 0) < 5) acc.belowFive += 1;
    if (Number(medicine.stockQty || 0) > 0 && Number(medicine.stockQty || 0) < 10) acc.belowTen += 1;
    return acc;
  }, { totalMedicines: 0, totalStockQty: 0, inventoryValue: 0, outOfStock: 0, belowFive: 0, belowTen: 0 });

  sendSuccess(res, 'Dashboard fetched.', {
    role: req.user.role,
    totals: {
      employees,
      patients,
      currentIpd,
      todayAdmissions,
      todayDischarges,
      todayRevenue: todayRevenueAgg[0]?.amount || 0,
      pendingDues: pendingAgg[0]?.amount || 0,
      doctors,
      beds: beds.length,
      verificationPending,
      dailyPending,
      totalMedicines: medicalStoreTotals.totalMedicines,
      outOfStockMedicines: medicalStoreTotals.outOfStock,
      todayMedicineRevenue: todayMedicineSalesAgg[0]?.amount || 0
    },
    bedSummary,
    recentPayments,
    recentInvoices,
    medicalStore: {
      totals: {
        ...medicalStoreTotals,
        todayMedicineBills: todayMedicineSalesAgg[0]?.count || 0,
        todayMedicineRevenue: todayMedicineSalesAgg[0]?.amount || 0
      },
      lowStockMedicines,
      recentMedicineSales
    }
  });
});

module.exports = { dashboard };
