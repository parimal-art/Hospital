const Ledger = require('../models/Ledger');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');

const getLedgers = asyncHandler(async (req, res) => {
  const { search, group, status } = req.query;
  const query = {};
  if (group) query.group = group;
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };
  const ledgers = await Ledger.find(query).sort({ name: 1 });
  sendSuccess(res, 'Ledgers fetched.', ledgers);
});

const createLedger = asyncHandler(async (req, res) => {
  const ledger = await Ledger.create({ ...req.body, createdBy: req.user._id });
  await logAudit({ req, action: 'Ledger Created', module: 'Ledgers', recordId: ledger._id, newData: ledger.toObject() });
  sendSuccess(res, 'Ledger created.', ledger, 201);
});

const getLedger = asyncHandler(async (req, res) => {
  const ledger = await Ledger.findById(req.params.id);
  if (!ledger) { res.status(404); throw new Error('Ledger not found.'); }
  sendSuccess(res, 'Ledger fetched.', ledger);
});

const updateLedger = asyncHandler(async (req, res) => {
  const ledger = await Ledger.findById(req.params.id);
  if (!ledger) { res.status(404); throw new Error('Ledger not found.'); }
  const oldData = ledger.toObject();
  Object.assign(ledger, req.body);
  await ledger.save();
  await logAudit({ req, action: 'Ledger Updated', module: 'Ledgers', recordId: ledger._id, oldData, newData: ledger.toObject() });
  sendSuccess(res, 'Ledger updated.', ledger);
});

const deleteLedger = asyncHandler(async (req, res) => {
  const used = await Transaction.exists({ ledger: req.params.id });
  if (used) { res.status(400); throw new Error('Cannot delete ledger because transactions exist.'); }
  const ledger = await Ledger.findByIdAndDelete(req.params.id);
  if (!ledger) { res.status(404); throw new Error('Ledger not found.'); }
  await logAudit({ req, action: 'Ledger Deleted', module: 'Ledgers', recordId: ledger._id, oldData: ledger.toObject() });
  sendSuccess(res, 'Ledger deleted.');
});

module.exports = { getLedgers, createLedger, getLedger, updateLedger, deleteLedger };
