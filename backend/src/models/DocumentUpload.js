const mongoose = require('mongoose');

const documentUploadSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documentType: {
    type: String,
    enum: ['IPD Note', 'Prescription', 'Lab Report', 'Discharge Paper', 'Billing File', 'Employee Document', 'Other'],
    default: 'Other'
  },
  fileUrl: { type: String, required: true },
  fileName: String,
  originalName: String,
  mimeType: String,
  size: Number,
  description: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DocumentUpload', documentUploadSchema);
