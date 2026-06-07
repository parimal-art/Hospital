const AuditLog = require('../models/AuditLog');

const logAudit = async ({ req, action, module, recordId, oldData = null, newData = null }) => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      role: req.user?.role,
      action,
      module,
      recordId,
      oldData,
      newData,
      ipAddress: req.ip
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
};

module.exports = logAudit;
