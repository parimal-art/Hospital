const mongoose = require('mongoose');

const doctorAssignmentSchema = new mongoose.Schema({
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  fromDateTime: { type: Date, default: Date.now },
  toDateTime: Date,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DoctorAssignment', doctorAssignmentSchema);
