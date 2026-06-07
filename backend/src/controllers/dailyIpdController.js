const dayjs = require('dayjs');
const DailyIPDEntry = require('../models/DailyIPDEntry');
const Admission = require('../models/Admission');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');

const normalizeDate = (date) => dayjs(date || new Date()).startOf('day').toDate();

const getEntries = asyncHandler(async (req, res) => {
  const { admission, patient, doctor, from, to } = req.query;
  const query = {};
  if (admission) query.admission = admission;
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;
  if (from || to) query.date = { ...(from ? { $gte: normalizeDate(from) } : {}), ...(to ? { $lte: normalizeDate(to) } : {}) };
  const entries = await DailyIPDEntry.find(query).populate('admission patient doctor enteredBy').sort({ date: -1 });
  sendSuccess(res, 'Daily IPD entries fetched.', entries);
});

const createEntry = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.body.admission).populate('bed assignedDoctor patient');
  if (!admission) { res.status(400); throw new Error('Valid admission is required.'); }
  if (['Discharged', 'Cancelled'].includes(admission.status)) { res.status(400); throw new Error('Cannot add daily entry to discharged/cancelled admission.'); }
  const date = normalizeDate(req.body.date);
  const existing = await DailyIPDEntry.findOne({ admission: admission._id, date });
  if (existing && !req.body.adminOverride) { res.status(400); throw new Error('Daily IPD entry already exists for this admission and date.'); }
  const attachments = (req.files || []).map((file) => `/uploads/${file.filename}`);
  const entry = await DailyIPDEntry.create({
    ...req.body,
    date,
    patient: admission.patient._id,
    doctor: admission.assignedDoctor?._id,
    bedRent: req.body.bedRent !== undefined ? req.body.bedRent : admission.bed?.dailyBedRent || 0,
    attachments,
    enteredBy: req.user._id
  });
  await logAudit({ req, action: 'Daily IPD Entry Created', module: 'Daily IPD', recordId: entry._id, newData: entry.toObject() });
  sendSuccess(res, 'Daily IPD entry created.', await DailyIPDEntry.findById(entry._id).populate('admission patient doctor enteredBy'), 201);
});

const getEntry = asyncHandler(async (req, res) => {
  const entry = await DailyIPDEntry.findById(req.params.id).populate('admission patient doctor enteredBy');
  if (!entry) { res.status(404); throw new Error('Daily IPD entry not found.'); }
  sendSuccess(res, 'Daily IPD entry fetched.', entry);
});

const updateEntry = asyncHandler(async (req, res) => {
  const entry = await DailyIPDEntry.findById(req.params.id);
  if (!entry) { res.status(404); throw new Error('Daily IPD entry not found.'); }
  const oldData = entry.toObject();
  Object.assign(entry, req.body);
  if (req.body.date) entry.date = normalizeDate(req.body.date);
  if (req.files?.length) entry.attachments.push(...req.files.map((file) => `/uploads/${file.filename}`));
  await entry.save();
  await logAudit({ req, action: 'Daily IPD Entry Updated', module: 'Daily IPD', recordId: entry._id, oldData, newData: entry.toObject() });
  sendSuccess(res, 'Daily IPD entry updated.', entry);
});

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await DailyIPDEntry.findByIdAndDelete(req.params.id);
  if (!entry) { res.status(404); throw new Error('Daily IPD entry not found.'); }
  await logAudit({ req, action: 'Daily IPD Entry Deleted', module: 'Daily IPD', recordId: entry._id, oldData: entry.toObject() });
  sendSuccess(res, 'Daily IPD entry deleted.');
});

module.exports = { getEntries, createEntry, getEntry, updateEntry, deleteEntry };
