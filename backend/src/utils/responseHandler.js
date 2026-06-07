const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, message = 'Error', statusCode = 500, errors = null) => {
  res.status(statusCode).json({ success: false, message, data: errors });
};

module.exports = { sendSuccess, sendError };
