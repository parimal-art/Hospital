const dayjs = require('dayjs');
const Doctor = require('../models/Doctor');
const Admission = require('../models/Admission');
const DoctorAssignment = require('../models/DoctorAssignment');
const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');
const { generateNumber } = require('../utils/generateNumbers');
const { sendSuccess } = require('../utils/responseHandler');

const getDoctors = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { specialization: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
  const doctors = await Doctor.find(query).populate('user', 'name email role').sort({ name: 1 });
  sendSuccess(res, 'Doctors fetched.', doctors);
});

const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create({ ...req.body, createdBy: req.user._id });
  await logAudit({ req, action: 'Doctor Created', module: 'Doctors', recordId: doctor._id, newData: doctor.toObject() });
  sendSuccess(res, 'Doctor created.', doctor, 201);
});

const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', 'name email role');
  if (!doctor) { res.status(404); throw new Error('Doctor not found.'); }
  sendSuccess(res, 'Doctor fetched.', doctor);
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found.'); }
  const oldData = doctor.toObject();
  Object.assign(doctor, req.body);
  await doctor.save();
  await logAudit({ req, action: 'Doctor Updated', module: 'Doctors', recordId: doctor._id, oldData, newData: doctor.toObject() });
  sendSuccess(res, 'Doctor updated.', doctor);
});

const getDoctorPatients = asyncHandler(async (req, res) => {
  const admissions = await Admission.find({ assignedDoctor: req.params.id, status: { $in: ['Admitted', 'Under Treatment', 'Discharge Requested'] } }).populate('patient bed assignedDoctor').sort({ createdAt: -1 });
  sendSuccess(res, 'Doctor patients fetched.', admissions);
});

const calculateDoctorWages = asyncHandler(async (req, res) => {
  const { from, to, markPaid } = req.query;
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found.'); }
  const start = from ? dayjs(from).startOf('day') : dayjs().startOf('month');
  const end = to ? dayjs(to).endOf('day') : dayjs().endOf('day');
  const assignments = await DoctorAssignment.find({
    doctor: doctor._id,
    fromDateTime: { $lte: end.toDate() },
    $or: [{ toDateTime: null }, { toDateTime: { $gte: start.toDate() } }]
  }).populate('patient admission doctor');

  const rows = assignments.map((a) => {
    const fromDate = dayjs.max ? dayjs.max(dayjs(a.fromDateTime), start) : (dayjs(a.fromDateTime).isAfter(start) ? dayjs(a.fromDateTime) : start);
    const toDate = a.toDateTime ? (dayjs(a.toDateTime).isBefore(end) ? dayjs(a.toDateTime) : end) : end;
    const days = Math.max(toDate.diff(fromDate, 'day') + 1, 1);
    let units = days;
    let amount = doctor.wageAmount || 0;
    if (doctor.wageType === 'Per Day') amount = units * doctor.wageAmount;
    else if (doctor.wageType === 'Per Patient') { units = 1; amount = doctor.wageAmount; }
    else if (doctor.wageType === 'Fixed') { units = 1; amount = doctor.wageAmount; }
    else if (doctor.wageType === 'Per Hour') { units = Math.max(toDate.diff(fromDate, 'hour'), 1); amount = units * doctor.wageAmount; }
    else if (doctor.wageType === 'Commission Percentage') amount = 0;
    return { assignment: a._id, patient: a.patient, admission: a.admission, wageType: doctor.wageType, units, rate: doctor.wageAmount, amount };
  });
  const total = rows.reduce((s, r) => s + r.amount, 0);

  if (markPaid === 'true' && total > 0) {
    let ledger = await Ledger.findOne({ name: 'Doctor Payable' });
    if (!ledger) ledger = await Ledger.create({ name: 'Doctor Payable', group: 'Doctor Payable', createdBy: req.user._id });
    await Transaction.create({ voucherNumber: await generateNumber(Transaction, 'voucherNumber', 'VCH'), voucherType: 'Payment', ledger: ledger._id, doctor: doctor._id, amount: total, paymentMode: 'Cash', description: `Doctor wage paid to ${doctor.name}`, createdBy: req.user._id });
  }
  sendSuccess(res, 'Doctor wage report fetched.', { doctor, from: start.toDate(), to: end.toDate(), rows, total });
});

module.exports = { getDoctors, createDoctor, getDoctor, updateDoctor, getDoctorPatients, calculateDoctorWages };
