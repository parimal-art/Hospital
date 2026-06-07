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
  referenceModel: { type: String, enum: ['MedicineSale', 'Medicine', 'Invoice', 'DailyIPDEntry', 'Manual', ''] , default: '' },
  referenceId: String,
  note: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

medicineStockMovementSchema.index({ medicine: 1, createdAt: -1 });

module.exports = mongoose.model('MedicineStockMovement', medicineStockMovementSchema);
