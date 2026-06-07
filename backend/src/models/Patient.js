const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  guardianName: String,
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  age: Number,
  dateOfBirth: Date,
  mobile: { type: String, trim: true },
  address: String,
  emergencyContact: String,
  patientType: { type: String, enum: ['OPD', 'IPD'], default: 'IPD' },
  registrationDate: { type: Date, default: Date.now },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
