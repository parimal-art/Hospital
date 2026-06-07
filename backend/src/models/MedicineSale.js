const mongoose = require('mongoose');

const medicineSaleItemSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  marketName: { type: String, required: true },
  composition: String,
  batchNo: String,
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, default: 0, min: 0 },
  mrp: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0 }
}, { _id: true });

const medicineSaleSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  saleType: { type: String, enum: ['IPD', 'Outsider'], default: 'Outsider' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  outsiderName: { type: String, trim: true },
  outsiderMobile: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  items: [medicineSaleItemSchema],
  subTotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI', 'Card', 'Cheque', 'Other', ''], default: 'Cash' },
  status: { type: String, enum: ['Paid', 'Partially Paid', 'Credit', 'Cancelled'], default: 'Credit' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  dailyIpdEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyIPDEntry' },
  notes: String,
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelReason: String,
  cancelledAt: Date
}, { timestamps: true });

medicineSaleSchema.index({ billNumber: 1, saleType: 1, date: -1 });
medicineSaleSchema.index({ outsiderName: 'text', outsiderMobile: 'text', billNumber: 'text' });

module.exports = mongoose.model('MedicineSale', medicineSaleSchema);
