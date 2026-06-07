const dayjs = require('dayjs');
const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const DailyIPDEntry = require('../models/DailyIPDEntry');
const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const DoctorAssignment = require('../models/DoctorAssignment');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { generateNumber } = require('../utils/generateNumbers');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');
const { ROLES } = require('../utils/roles');

const populateAdmission = (q) => q.populate('patient bed assignedDoctor createdBy dischargedBy');

const calculateAdmissionCharges = async (admissionId) => {
  const entries = await DailyIPDEntry.find({ admission: admissionId });
  const dailyTotal = entries.reduce((sum, e) => sum + ['bedRent', 'dailyDoctorVisitCharge', 'nursingCharge', 'medicineCharge', 'labTestCharge', 'otherServiceCharge', 'otherExpense'].reduce((s, k) => s + Number(e[k] || 0), 0), 0);
  const deposits = await Transaction.find({ admission: admissionId, voucherType: 'Receipt', status: 'Posted' });
  const depositTotal = deposits.reduce((s, t) => s + Number(t.amount || 0), 0);
  return { dailyTotal, depositTotal, netPayable: dailyTotal, balanceDue: Math.max(dailyTotal - depositTotal, 0), refundAmount: Math.max(depositTotal - dailyTotal, 0), entries };
};

const getAdmissions = asyncHandler(async (req, res) => {
  const { search, status, patient, doctor, from, to } = req.query;
  const query = {};
  if (status) query.status = status;
  if (patient) query.patient = patient;
  if (doctor) query.assignedDoctor = doctor;
  if (from || to) query.admissionDateTime = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (search) query.admissionNumber = { $regex: search, $options: 'i' };
  let admissions = await populateAdmission(Admission.find(query)).sort({ createdAt: -1 });
  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ user: req.user._id });
    admissions = doctor ? admissions.filter((a) => String(a.assignedDoctor?._id) === String(doctor._id)) : [];
  }
  sendSuccess(res, 'Admissions fetched.', admissions);
});

const createAdmission = asyncHandler(async (req, res) => {
  const { patient, bed, assignedDoctor, initialDeposit = 0 } = req.body;
  if (!patient || !bed || !assignedDoctor) { res.status(400); throw new Error('Patient, bed and doctor are required.'); }
  const [patientDoc, bedDoc, doctorDoc] = await Promise.all([Patient.findById(patient), Bed.findById(bed), Doctor.findById(assignedDoctor)]);
  if (!patientDoc || !bedDoc || !doctorDoc) { res.status(400); throw new Error('Valid patient, bed and doctor are required.'); }
  if (bedDoc.status === 'Occupied') { res.status(400); throw new Error('Occupied bed cannot be assigned to another active admission.'); }

  const admissionNumber = req.body.admissionNumber || await generateNumber(Admission, 'admissionNumber', 'IPD');
  const admission = await Admission.create({ ...req.body, admissionNumber, createdBy: req.user._id });
  bedDoc.status = 'Occupied';
  bedDoc.currentPatient = patientDoc._id;
  bedDoc.currentAdmission = admission._id;
  await bedDoc.save();

  await DoctorAssignment.create({ admission: admission._id, patient: patientDoc._id, doctor: doctorDoc._id, createdBy: req.user._id });

  if (Number(initialDeposit) > 0) {
    let cash = await Ledger.findOne({ name: 'Cash' });
    if (!cash) cash = await Ledger.create({ name: 'Cash', group: 'Cash', createdBy: req.user._id });
    await Transaction.create({ voucherNumber: await generateNumber(Transaction, 'voucherNumber', 'VCH'), voucherType: 'Receipt', ledger: cash._id, patient, admission: admission._id, amount: initialDeposit, paymentMode: req.body.paymentMode || 'Cash', description: `Initial deposit for ${admissionNumber}`, createdBy: req.user._id });
  }

  await Notification.create({ title: 'New admission created', message: `${patientDoc.name} admitted to ${bedDoc.bedNumber}.`, module: 'Admissions', recordId: String(admission._id), targetRoles: [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.NURSE], createdBy: req.user._id });
  await logAudit({ req, action: 'Admission Created', module: 'Admissions', recordId: admission._id, newData: admission.toObject() });
  sendSuccess(res, 'Admission created.', await populateAdmission(Admission.findById(admission._id)), 201);
});

const getAdmission = asyncHandler(async (req, res) => {
  const admission = await populateAdmission(Admission.findById(req.params.id));
  if (!admission) { res.status(404); throw new Error('Admission not found.'); }
  const charges = await calculateAdmissionCharges(admission._id);
  sendSuccess(res, 'Admission fetched.', { admission, charges });
});

const updateAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) { res.status(404); throw new Error('Admission not found.'); }
  const oldData = admission.toObject();
  if (req.body.bed && String(req.body.bed) !== String(admission.bed)) {
    const newBed = await Bed.findById(req.body.bed);
    if (!newBed || newBed.status === 'Occupied') { res.status(400); throw new Error('New bed is not available.'); }
    await Bed.findByIdAndUpdate(admission.bed, { status: 'Available', currentPatient: null, currentAdmission: null });
    newBed.status = 'Occupied';
    newBed.currentPatient = admission.patient;
    newBed.currentAdmission = admission._id;
    await newBed.save();
  }
  if (req.body.assignedDoctor && String(req.body.assignedDoctor) !== String(admission.assignedDoctor)) {
    await DoctorAssignment.updateMany({ admission: admission._id, toDateTime: null }, { toDateTime: new Date() });
    await DoctorAssignment.create({ admission: admission._id, patient: admission.patient, doctor: req.body.assignedDoctor, createdBy: req.user._id });
  }
  Object.assign(admission, req.body);
  await admission.save();
  await logAudit({ req, action: 'Admission Updated', module: 'Admissions', recordId: admission._id, oldData, newData: admission.toObject() });
  sendSuccess(res, 'Admission updated.', await populateAdmission(Admission.findById(admission._id)));
});

const dischargeRequest = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) { res.status(404); throw new Error('Admission not found.'); }
  admission.status = 'Discharge Requested';
  await admission.save();
  await Notification.create({ title: 'Discharge request created', message: `Admission ${admission.admissionNumber} is ready for final billing.`, module: 'Admissions', recordId: String(admission._id), targetRoles: [ROLES.ADMIN, ROLES.ACCOUNTS], createdBy: req.user._id });
  await logAudit({ req, action: 'Discharge Requested', module: 'Admissions', recordId: admission._id });
  sendSuccess(res, 'Discharge requested.', admission);
});

const discharge = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) { res.status(404); throw new Error('Admission not found.'); }
  const charges = await calculateAdmissionCharges(admission._id);
  if (charges.balanceDue > 0 && req.user.role !== ROLES.ADMIN && !req.body.approveDueDischarge) {
    res.status(400); throw new Error('Cannot discharge because final bill has pending due. Admin approval is required.');
  }
  admission.status = 'Discharged';
  admission.dischargeDateTime = req.body.dischargeDateTime || new Date();
  admission.dischargeSummary = req.body.dischargeSummary;
  admission.finalBillLocked = true;
  admission.dueDischargeApproved = Boolean(req.body.approveDueDischarge || req.user.role === ROLES.ADMIN);
  admission.dischargedBy = req.user._id;
  await admission.save();
  await Bed.findByIdAndUpdate(admission.bed, { status: 'Available', currentPatient: null, currentAdmission: null });
  await DoctorAssignment.updateMany({ admission: admission._id, toDateTime: null }, { toDateTime: admission.dischargeDateTime });
  await logAudit({ req, action: 'Admission Discharged', module: 'Admissions', recordId: admission._id, newData: charges });
  sendSuccess(res, 'Patient discharged and bed released.', { admission, charges });
});

module.exports = { getAdmissions, createAdmission, getAdmission, updateAdmission, dischargeRequest, discharge, calculateAdmissionCharges };
