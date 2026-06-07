const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  specialization: String,
  phone: String,
  email: { type: String, trim: true, lowercase: true },
  address: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wageType: { type: String, enum: ['Per Day', 'Per Round', 'Per Patient', 'Per Hour', 'Commission Percentage', 'Fixed'], default: 'Per Day' },
  wageAmount: { type: Number, default: 0 },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
