const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  rate: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0 }
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceType: { type: String, enum: ['Normal', 'Discharge Final'], default: 'Normal' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  ledger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  date: { type: Date, default: Date.now },
  items: [invoiceItemSchema],
  subTotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI', 'Card', 'Cheque', 'Other', ''], default: '' },
  notes: String,
  status: { type: String, enum: ['Draft', 'Paid', 'Partially Paid', 'Cancelled'], default: 'Draft' },
  cancelReason: String,
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
