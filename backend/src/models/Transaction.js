const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  voucherNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  voucherType: { type: String, enum: ['Payment', 'Receipt', 'Journal', 'Adjustment'], required: true },
  ledger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true, min: 0 },
  paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI', 'Card', 'Cheque', 'Other'], default: 'Cash' },
  description: String,
  status: { type: String, enum: ['Posted', 'Cancelled'], default: 'Posted' },
  cancelReason: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
