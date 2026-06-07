const mongoose = require('mongoose');

const dailyIPDEntrySchema = new mongoose.Schema({
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  date: { type: Date, required: true },
  bedRent: { type: Number, default: 0 },
  dailyDoctorVisitCharge: { type: Number, default: 0 },
  nursingCharge: { type: Number, default: 0 },
  medicineCharge: { type: Number, default: 0 },
  labTestCharge: { type: Number, default: 0 },
  otherServiceCharge: { type: Number, default: 0 },
  otherExpense: { type: Number, default: 0 },
  notes: String,
  attachments: [String],
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

dailyIPDEntrySchema.index({ admission: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyIPDEntry', dailyIPDEntrySchema);
