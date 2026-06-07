const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  group: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank', 'Patient Receivable', 'Income', 'Expense', 'Doctor Payable', 'Supplier', 'Asset', 'Liability', 'Other']
  },
  openingBalance: { type: Number, default: 0 },
  balanceType: { type: String, enum: ['Debit', 'Credit'], default: 'Debit' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
