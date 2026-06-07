const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const DocumentUpload = require('../models/DocumentUpload');
const asyncHandler = require('../utils/asyncHandler');
const { generateNumber } = require('../utils/generateNumbers');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');

const getPatients = asyncHandler(async (req, res) => {
  const { search, patientType } = req.query;
  const query = {};
  if (patientType) query.patientType = patientType;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { registrationNumber: { $regex: search, $options: 'i' } },
    { mobile: { $regex: search, $options: 'i' } }
  ];
  const patients = await Patient.find(query).sort({ createdAt: -1 });
  sendSuccess(res, 'Patients fetched.', patients);
});

const createPatient = asyncHandler(async (req, res) => {
  const registrationNumber = req.body.registrationNumber || await generateNumber(Patient, 'registrationNumber', 'PAT');
  const patient = await Patient.create({ ...req.body, registrationNumber, createdBy: req.user._id });
  await logAudit({ req, action: 'Patient Created', module: 'Patients', recordId: patient._id, newData: patient.toObject() });
  sendSuccess(res, 'Patient created.', patient, 201);
});

const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) { res.status(404); throw new Error('Patient not found.'); }
  sendSuccess(res, 'Patient fetched.', patient);
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) { res.status(404); throw new Error('Patient not found.'); }
  const oldData = patient.toObject();
  Object.assign(patient, req.body);
  await patient.save();
  await logAudit({ req, action: 'Patient Updated', module: 'Patients', recordId: patient._id, oldData, newData: patient.toObject() });
  sendSuccess(res, 'Patient updated.', patient);
});

const getTimeline = asyncHandler(async (req, res) => {
  const [admissions, invoices, transactions, documents] = await Promise.all([
    Admission.find({ patient: req.params.id }).populate('bed assignedDoctor').sort({ createdAt: -1 }),
    Invoice.find({ patient: req.params.id }).sort({ createdAt: -1 }),
    Transaction.find({ patient: req.params.id }).populate('ledger').sort({ createdAt: -1 }),
    DocumentUpload.find({ patient: req.params.id }).sort({ createdAt: -1 })
  ]);
  sendSuccess(res, 'Patient timeline fetched.', { admissions, invoices, transactions, documents });
});

module.exports = { getPatients, createPatient, getPatient, updatePatient, getTimeline };
