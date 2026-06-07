const fs = require('fs');
const path = require('path');
const DocumentUpload = require('../models/DocumentUpload');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');

const getDocuments = asyncHandler(async (req, res) => {
  const { patient, admission, employee, documentType, search, from, to } = req.query;
  const query = {};
  if (patient) query.patient = patient;
  if (admission) query.admission = admission;
  if (employee) query.employee = employee;
  if (documentType) query.documentType = documentType;
  if (from || to) query.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (search) query.$or = [{ fileName: { $regex: search, $options: 'i' } }, { originalName: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
  const docs = await DocumentUpload.find(query).populate('patient admission employee uploadedBy').sort({ createdAt: -1 });
  sendSuccess(res, 'Documents fetched.', docs);
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('File is required.'); }
  const doc = await DocumentUpload.create({
    patient: req.body.patient || undefined,
    admission: req.body.admission || undefined,
    employee: req.body.employee || undefined,
    documentType: req.body.documentType || 'Other',
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    description: req.body.description,
    uploadedBy: req.user._id
  });
  await logAudit({ req, action: 'Document Uploaded', module: 'Documents', recordId: doc._id, newData: doc.toObject() });
  sendSuccess(res, 'Document uploaded.', doc, 201);
});

const getDocument = asyncHandler(async (req, res) => {
  const doc = await DocumentUpload.findById(req.params.id).populate('patient admission employee uploadedBy');
  if (!doc) { res.status(404); throw new Error('Document not found.'); }
  sendSuccess(res, 'Document fetched.', doc);
});

const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await DocumentUpload.findByIdAndDelete(req.params.id);
  if (!doc) { res.status(404); throw new Error('Document not found.'); }
  const localPath = path.join(__dirname, '..', doc.fileUrl || '');
  if (doc.fileUrl && fs.existsSync(localPath)) fs.unlinkSync(localPath);
  await logAudit({ req, action: 'Document Deleted', module: 'Documents', recordId: doc._id, oldData: doc.toObject() });
  sendSuccess(res, 'Document deleted.');
});

module.exports = { getDocuments, uploadDocument, getDocument, deleteDocument };
