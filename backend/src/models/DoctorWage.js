const mongoose = require('mongoose');

const doctorWageSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  fromDate: Date,
  toDate: Date,
  wageType: String,
  units: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['Payable', 'Paid', 'Cancelled'], default: 'Payable' },
  paidTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DoctorWage', doctorWageSchema);
