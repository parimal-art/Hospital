const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error('You do not have permission to perform this action.'));
  }
  next();
};

const readOnlyBlock = (req, res, next) => {
  if (req.user?.role === 'Auditor/Viewer' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.status(403);
    return next(new Error('Auditor/Viewer has read-only access.'));
  }
  next();
};

module.exports = { authorize, readOnlyBlock };
