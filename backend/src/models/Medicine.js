const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  marketName: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  composition: { type: String, required: true, trim: true, index: true },
  strength: { type: String, trim: true },
  dosageForm: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Other'],
    default: 'Tablet'
  },
  company: { type: String, trim: true },
  supplier: { type: String, trim: true },
  batchNo: { type: String, trim: true },
  hsnCode: { type: String, trim: true },
  expiryDate: Date,
  purchaseRate: { type: Number, default: 0, min: 0 },
  mrp: { type: Number, default: 0, min: 0 },
  saleRate: { type: Number, default: 0, min: 0 },
  stockQty: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'pcs', trim: true },
  rackNo: { type: String, trim: true },
  reorderLevel: { type: Number, default: 10, min: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  lastStockAddedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

medicineSchema.index({ marketName: 'text', composition: 'text', company: 'text', batchNo: 'text' });
medicineSchema.index({ marketName: 1, batchNo: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
