const Ledger = require('../models/Ledger');
const Transaction = require('../models/Transaction');
const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const DailyIPDEntry = require('../models/DailyIPDEntry');
const Invoice = require('../models/Invoice');
const DocumentUpload = require('../models/DocumentUpload');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');

const dateQuery = (field, from, to) => (from || to ? { [field]: { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) } } : {});

const paymentDetails = asyncHandler(async (req, res) => {
  const { from, to, search } = req.query;
  const query = { ...dateQuery('date', from, to) };
  if (search) query.description = { $regex: search, $options: 'i' };
  const rows = await Transaction.find(query).populate('ledger patient doctor').sort({ date: 1 });
  sendSuccess(res, 'Payment details report fetched.', rows);
});

const dayBook = asyncHandler(async (req, res) => {
  const rows = await Transaction.find({ status: 'Posted', ...dateQuery('date', req.query.from, req.query.to) }).populate('ledger patient doctor').sort({ date: 1 });
  const summary = rows.reduce((acc, tx) => {
    const key = tx.voucherType;
    acc[key] = (acc[key] || 0) + Number(tx.amount || 0);
    return acc;
  }, {});
  sendSuccess(res, 'Day book report fetched.', { rows, summary });
});

const trialBalance = asyncHandler(async (req, res) => {
  const ledgers = await Ledger.find();
  const transactions = await Transaction.find({ status: 'Posted', ...dateQuery('date', req.query.from, req.query.to) });
  const rows = ledgers.map((ledger) => {
    const related = transactions.filter((tx) => String(tx.ledger) === String(ledger._id));
    const debit = (ledger.balanceType === 'Debit' ? ledger.openingBalance : 0) + related.filter((tx) => ['Payment', 'Journal'].includes(tx.voucherType)).reduce((s, tx) => s + tx.amount, 0);
    const credit = (ledger.balanceType === 'Credit' ? ledger.openingBalance : 0) + related.filter((tx) => ['Receipt', 'Adjustment'].includes(tx.voucherType)).reduce((s, tx) => s + tx.amount, 0);
    return { ledger, debit, credit };
  });
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  sendSuccess(res, 'Trial balance report fetched.', { rows, totalDebit, totalCredit, matched: totalDebit === totalCredit });
});

const balanceSheet = asyncHandler(async (req, res) => {
  const trial = await Ledger.find();
  const transactions = await Transaction.find({ status: 'Posted', ...dateQuery('date', req.query.from, req.query.to) });
  const groups = {};
  trial.forEach((ledger) => {
    const related = transactions.filter((tx) => String(tx.ledger) === String(ledger._id));
    const amount = ledger.openingBalance + related.reduce((s, tx) => s + (['Receipt', 'Adjustment'].includes(tx.voucherType) ? tx.amount : -tx.amount), 0);
    if (!groups[ledger.group]) groups[ledger.group] = [];
    groups[ledger.group].push({ ledger, amount });
  });
  sendSuccess(res, 'Balance sheet report fetched.', groups);
});

const patientCommission = asyncHandler(async (req, res) => {
  const rows = await Admission.find(dateQuery('admissionDateTime', req.query.from, req.query.to)).populate('patient assignedDoctor');
  sendSuccess(res, 'Patient name-wise commission report fetched.', rows);
});

const admissionDischarge = asyncHandler(async (req, res) => {
  const rows = await Admission.find({ ...dateQuery('admissionDateTime', req.query.from, req.query.to) }).populate('patient bed assignedDoctor').sort({ admissionDateTime: -1 });
  sendSuccess(res, 'Admission to discharge report fetched.', rows);
});

const doctorWages = asyncHandler(async (req, res) => {
  const rows = await Admission.find({ ...dateQuery('admissionDateTime', req.query.from, req.query.to) }).populate('patient assignedDoctor');
  sendSuccess(res, 'Doctor wages report base data fetched.', rows);
});

const pendingDues = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ balanceAmount: { $gt: 0 }, status: { $ne: 'Cancelled' } }).populate('patient admission').sort({ date: -1 });
  sendSuccess(res, 'Pending dues report fetched.', invoices);
});

const ipdNotes = asyncHandler(async (req, res) => {
  const rows = await DocumentUpload.find({ documentType: { $in: ['IPD Note', 'Prescription', 'Lab Report', 'Discharge Paper', 'Billing File'] }, ...dateQuery('createdAt', req.query.from, req.query.to) }).populate('patient admission uploadedBy').sort({ createdAt: -1 });
  sendSuccess(res, 'IPD notes report fetched.', rows);
});

const employeeVerification = asyncHandler(async (req, res) => {
  const rows = await User.find({ role: { $exists: true } }).select('-password').sort({ verificationStatus: 1, createdAt: -1 });
  sendSuccess(res, 'Employee verification report fetched.', rows);
});

const dailyBedRent = asyncHandler(async (req, res) => {
  const rows = await DailyIPDEntry.find({ ...dateQuery('date', req.query.from, req.query.to) }).populate('admission patient doctor').sort({ date: -1 });
  sendSuccess(res, 'Daily bed rent report fetched.', rows.map((r) => ({ ...r.toObject(), total: r.bedRent })));
});

const dailyExpense = asyncHandler(async (req, res) => {
  const rows = await DailyIPDEntry.find({ ...dateQuery('date', req.query.from, req.query.to) }).populate('admission patient doctor').sort({ date: -1 });
  sendSuccess(res, 'Daily expense report fetched.', rows);
});

const billingReport = asyncHandler(async (req, res) => {
  const rows = await Invoice.find({ ...dateQuery('date', req.query.from, req.query.to) }).populate('patient admission').sort({ date: -1 });
  sendSuccess(res, 'Billing invoice report fetched.', rows);
});

module.exports = { paymentDetails, dayBook, trialBalance, balanceSheet, patientCommission, admissionDischarge, doctorWages, pendingDues, ipdNotes, employeeVerification, dailyBedRent, dailyExpense, billingReport };
