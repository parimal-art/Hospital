const Bed = require('../models/Bed');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');

const getBeds = asyncHandler(async (req, res) => {
  const { search, status, bedType, wardName } = req.query;
  const query = {};
  if (status) query.status = status;
  if (bedType) query.bedType = bedType;
  if (wardName) query.wardName = { $regex: wardName, $options: 'i' };
  if (search) query.$or = [{ bedNumber: { $regex: search, $options: 'i' } }, { wardName: { $regex: search, $options: 'i' } }];
  const beds = await Bed.find(query).populate('currentPatient currentAdmission').sort({ wardName: 1, bedNumber: 1 });
  sendSuccess(res, 'Beds fetched.', beds);
});

const createBed = asyncHandler(async (req, res) => {
  const bed = await Bed.create({ ...req.body, createdBy: req.user._id });
  await logAudit({ req, action: 'Bed Created', module: 'Beds', recordId: bed._id, newData: bed.toObject() });
  sendSuccess(res, 'Bed created.', bed, 201);
});

const updateBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed) { res.status(404); throw new Error('Bed not found.'); }
  const oldData = bed.toObject();
  Object.assign(bed, req.body);
  await bed.save();
  await logAudit({ req, action: 'Bed Updated', module: 'Beds', recordId: bed._id, oldData, newData: bed.toObject() });
  sendSuccess(res, 'Bed updated.', bed);
});

const updateStatus = asyncHandler(async (req, res) => {
  const update = { status: req.body.status };
  if (req.body.status !== 'Occupied') {
    update.currentPatient = null;
    update.currentAdmission = null;
  }
  const bed = await Bed.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!bed) { res.status(404); throw new Error('Bed not found.'); }
  await logAudit({ req, action: 'Bed Status Updated', module: 'Beds', recordId: bed._id, newData: update });
  sendSuccess(res, 'Bed status updated.', bed);
});

module.exports = { getBeds, createBed, updateBed, updateStatus };
