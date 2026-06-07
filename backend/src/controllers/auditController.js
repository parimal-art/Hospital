const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');

const getAuditLogs = asyncHandler(async (req, res) => {
  const { module, action, from, to } = req.query;
  const query = {};
  if (module) query.module = module;
  if (action) query.action = { $regex: action, $options: 'i' };
  if (from || to) query.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  const logs = await AuditLog.find(query).populate('user', 'name email').sort({ createdAt: -1 }).limit(Number(req.query.limit || 500));
  sendSuccess(res, 'Audit logs fetched.', logs);
});

module.exports = { getAuditLogs };
