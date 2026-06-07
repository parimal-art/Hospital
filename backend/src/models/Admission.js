const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  admissionNumber: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  admissionDateTime: { type: Date, default: Date.now },
  dischargeDateTime: Date,
  bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  admissionReason: String,
  diagnosis: String,
  initialDeposit: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Admitted', 'Under Treatment', 'Discharge Requested', 'Discharged', 'Cancelled'],
    default: 'Admitted'
  },
  finalBillLocked: { type: Boolean, default: false },
  dischargeSummary: String,
  dueDischargeApproved: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dischargedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Admission', admissionSchema);
