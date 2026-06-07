const mongoose = require('mongoose');

const medicineStockMovementSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  movementType: {
    type: String,
    enum: ['Opening', 'Add Stock', 'Sale', 'Sale Cancel', 'Adjustment'],
    required: true
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  referenceModel: { type: String, enum: ['MedicineSale', 'Medicine', 'Invoice', 'DailyIPDEntry', 'Manual', ''], default: '' },
  referenceId: String,
  billNumber: { type: String, unique: true, sparse: true, trim: true },
  stockAddingDate: Date,
  supplier: { type: String, trim: true },
  purchaseRate: { type: Number, default: 0, min: 0 },
  subTotal: { type: Number, default: 0, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 99 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI', 'Card', 'Cheque', 'Other', ''], default: 'Cash' },
  note: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

medicineStockMovementSchema.index({ medicine: 1, createdAt: -1 });
medicineStockMovementSchema.index({ billNumber: 1, stockAddingDate: -1 });

module.exports = mongoose.model('MedicineStockMovement', medicineStockMovementSchema);
