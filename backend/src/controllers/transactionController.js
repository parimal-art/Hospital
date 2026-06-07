const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const asyncHandler = require('../utils/asyncHandler');
const { generateNumber } = require('../utils/generateNumbers');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');

const getTransactions = asyncHandler(async (req, res) => {
  const { search, voucherType, ledger, paymentMode, from, to, patient, doctor } = req.query;
  const query = {};
  if (voucherType) query.voucherType = voucherType;
  if (ledger) query.ledger = ledger;
  if (paymentMode) query.paymentMode = paymentMode;
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;
  if (from || to) query.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (search) query.$or = [{ voucherNumber: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
  const items = await Transaction.find(query).populate('ledger patient doctor').sort({ date: -1, createdAt: -1 });
  sendSuccess(res, 'Transactions fetched.', items);
});

const createTransaction = asyncHandler(async (req, res) => {
  if (Number(req.body.amount) < 0) { res.status(400); throw new Error('Amount cannot be negative.'); }
  const ledger = await Ledger.findById(req.body.ledger);
  if (!ledger) { res.status(400); throw new Error('Valid ledger is required.'); }
  const voucherNumber = req.body.voucherNumber || await generateNumber(Transaction, 'voucherNumber', 'VCH');
  const transaction = await Transaction.create({ ...req.body, voucherNumber, createdBy: req.user._id });
  await logAudit({ req, action: 'Transaction Created', module: 'Transactions', recordId: transaction._id, newData: transaction.toObject() });
  sendSuccess(res, 'Transaction created.', transaction, 201);
});

const getTransaction = asyncHandler(async (req, res) => {
  const item = await Transaction.findById(req.params.id).populate('ledger patient doctor admission invoice createdBy', 'name email registrationNumber admissionNumber invoiceNumber voucherNumber');
  if (!item) { res.status(404); throw new Error('Transaction not found.'); }
  sendSuccess(res, 'Transaction fetched.', item);
});

const updateTransaction = asyncHandler(async (req, res) => {
  if (Number(req.body.amount) < 0) { res.status(400); throw new Error('Amount cannot be negative.'); }
  const item = await Transaction.findById(req.params.id);
  if (!item) { res.status(404); throw new Error('Transaction not found.'); }
  const oldData = item.toObject();
  Object.assign(item, req.body);
  await item.save();
  await logAudit({ req, action: 'Transaction Updated', module: 'Transactions', recordId: item._id, oldData, newData: item.toObject() });
  sendSuccess(res, 'Transaction updated.', item);
});

const cancelTransaction = asyncHandler(async (req, res) => {
  const item = await Transaction.findById(req.params.id);
  if (!item) { res.status(404); throw new Error('Transaction not found.'); }
  item.status = 'Cancelled';
  item.cancelReason = req.body.cancelReason || 'Cancelled by user';
  await item.save();
  await logAudit({ req, action: 'Transaction Cancelled', module: 'Transactions', recordId: item._id, newData: { cancelReason: item.cancelReason } });
  sendSuccess(res, 'Transaction cancelled.', item);
});

module.exports = { getTransactions, createTransaction, getTransaction, updateTransaction, cancelTransaction };
