const User = require('../models/User');
const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const Doctor = require('../models/Doctor');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const DailyIPDEntry = require('../models/DailyIPDEntry');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');

const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const endOfToday = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };

const dashboard = asyncHandler(async (req, res) => {
  const todayRange = { $gte: startOfToday(), $lte: endOfToday() };
  const [employees, patients, currentIpd, todayAdmissions, todayDischarges, doctors, beds, verificationPending, recentPayments, recentInvoices, dailyPending] = await Promise.all([
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
    Admission.countDocuments({ status: { $in: ['Admitted', 'Under Treatment'] } })
  ]);
  const todayRevenueAgg = await Transaction.aggregate([
    { $match: { voucherType: 'Receipt', status: 'Posted', date: todayRange } },
    { $group: { _id: null, amount: { $sum: '$amount' } } }
  ]);
  const pendingAgg = await Invoice.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, amount: { $sum: '$balanceAmount' } } }]);
  const bedSummary = beds.reduce((acc, bed) => { acc[bed.status] = (acc[bed.status] || 0) + 1; return acc; }, {});
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
      dailyPending
    },
    bedSummary,
    recentPayments,
    recentInvoices
  });
});

module.exports = { dashboard };
