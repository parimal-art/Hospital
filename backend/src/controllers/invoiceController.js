const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const asyncHandler = require('../utils/asyncHandler');
const { generateNumber } = require('../utils/generateNumbers');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');

const calculateInvoice = (body) => {
  const items = (body.items || []).map((item) => {
    const line = Number(item.quantity || 0) * Number(item.rate || 0);
    const total = Math.max(line - Number(item.discount || 0) + Number(item.tax || 0), 0);
    return { ...item, total };
  });
  const subTotal = items.reduce((s, i) => s + i.total, 0);
  const total = Math.max(subTotal - Number(body.discount || 0) + Number(body.tax || 0), 0);
  const paidAmount = Number(body.paidAmount || 0);
  const balanceAmount = Math.max(total - paidAmount, 0);
  const refundAmount = Math.max(paidAmount - total, 0);
  const status = body.status || (paidAmount <= 0 ? 'Draft' : balanceAmount === 0 ? 'Paid' : 'Partially Paid');
  return { items, subTotal, total, paidAmount, balanceAmount, refundAmount, status };
};

const getInvoices = asyncHandler(async (req, res) => {
  const { search, status, patient, from, to, invoiceType } = req.query;
  const query = {};
  if (status) query.status = status;
  if (patient) query.patient = patient;
  if (invoiceType) query.invoiceType = invoiceType;
  if (from || to) query.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (search) query.invoiceNumber = { $regex: search, $options: 'i' };
  const invoices = await Invoice.find(query).populate('patient admission ledger doctor preparedBy approvedBy').sort({ createdAt: -1 });
  sendSuccess(res, 'Invoices fetched.', invoices);
});

const createInvoice = asyncHandler(async (req, res) => {
  if (!req.body.items?.length) { res.status(400); throw new Error('At least one invoice item is required.'); }
  const invoiceNumber = req.body.invoiceNumber || await generateNumber(Invoice, 'invoiceNumber', 'INV');
  const calc = calculateInvoice(req.body);
  const invoice = await Invoice.create({ ...req.body, ...calc, invoiceNumber, preparedBy: req.user._id });
  if (invoice.paidAmount > 0) {
    let ledger = invoice.ledger ? await Ledger.findById(invoice.ledger) : await Ledger.findOne({ name: 'Cash' });
    if (!ledger) ledger = await Ledger.create({ name: 'Cash', group: 'Cash', createdBy: req.user._id });
    await Transaction.create({ voucherNumber: await generateNumber(Transaction, 'voucherNumber', 'VCH'), voucherType: 'Receipt', ledger: ledger._id, patient: invoice.patient, admission: invoice.admission, invoice: invoice._id, amount: invoice.paidAmount, paymentMode: invoice.paymentMode || 'Cash', description: `Payment for invoice ${invoice.invoiceNumber}`, createdBy: req.user._id });
  }
  await logAudit({ req, action: 'Invoice Created', module: 'Invoices', recordId: invoice._id, newData: invoice.toObject() });
  sendSuccess(res, 'Invoice created.', invoice, 201);
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('patient admission ledger doctor preparedBy approvedBy');
  if (!invoice) { res.status(404); throw new Error('Invoice not found.'); }
  sendSuccess(res, 'Invoice fetched.', invoice);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) { res.status(404); throw new Error('Invoice not found.'); }
  if (invoice.status === 'Paid') { res.status(400); throw new Error('Paid invoice cannot be edited.'); }
  const oldData = invoice.toObject();
  Object.assign(invoice, req.body, calculateInvoice(req.body));
  await invoice.save();
  await logAudit({ req, action: 'Invoice Updated', module: 'Invoices', recordId: invoice._id, oldData, newData: invoice.toObject() });
  sendSuccess(res, 'Invoice updated.', invoice);
});

const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) { res.status(404); throw new Error('Invoice not found.'); }
  invoice.status = 'Cancelled';
  invoice.cancelReason = req.body.cancelReason || 'Cancelled by authorized user';
  await invoice.save();
  await logAudit({ req, action: 'Invoice Cancelled', module: 'Invoices', recordId: invoice._id, newData: { cancelReason: invoice.cancelReason } });
  sendSuccess(res, 'Invoice cancelled.', invoice);
});

const printInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('patient admission ledger doctor preparedBy approvedBy');
  if (!invoice) { res.status(404); throw new Error('Invoice not found.'); }
  sendSuccess(res, 'Invoice print data fetched.', invoice);
});

module.exports = { getInvoices, createInvoice, getInvoice, updateInvoice, cancelInvoice, printInvoice };
