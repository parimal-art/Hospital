const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true, trim: true, unique: true },
  wardName: { type: String, required: true, trim: true },
  bedType: { type: String, enum: ['General', 'Private', 'ICU', 'Semi-private', 'Other'], default: 'General' },
  dailyBedRent: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' },
  currentPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  currentAdmission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Bed', bedSchema);
