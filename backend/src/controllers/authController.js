const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const validatePassword = require('../utils/passwordValidator');
const sendEmail = require('../utils/sendEmail');
const { sendSuccess } = require('../utils/responseHandler');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account is inactive. Contact administrator.');
  }

  await AuditLog.create({ user: user._id, role: user.role, action: 'Login', module: 'Auth', recordId: String(user._id), ipAddress: req.ip });

  const token = signToken(user._id);
  const safeUser = await User.findById(user._id).select('-password');
  sendSuccess(res, 'Login successful.', {
    token,
    user: safeUser,
    mustChangePassword: user.firstLogin || !user.passwordChanged
  });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Logged-in user fetched.', req.user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('Current password, new password and confirm password are required.');
  }
  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('New password and confirm password must match.');
  }
  const validationError = validatePassword(newPassword);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect.');
  }
  if (await user.matchPassword(newPassword)) {
    res.status(400);
    throw new Error('New password cannot be the same as old password.');
  }

  user.password = await User.hashPassword(newPassword);
  user.firstLogin = false;
  user.passwordChanged = true;
  user.lastPasswordChangedAt = new Date();
  await user.save();

  await AuditLog.create({ user: user._id, role: user.role, action: 'Password Changed', module: 'Auth', recordId: String(user._id), ipAddress: req.ip });
  sendSuccess(res, 'Password changed successfully. Please login again with your new password.');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const generic = 'If this email is registered, a password reset link has been sent.';

  const user = await User.findOne({ email: String(email || '').toLowerCase() });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Clinic ERP Password Reset',
      text: `Open this link to reset your password. It expires in 15 minutes: ${resetLink}`,
      html: `<p>Open this link to reset your password. It expires in 15 minutes.</p><p><a href="${resetLink}">Reset Password</a></p>`
    });
    await AuditLog.create({ user: user._id, role: user.role, action: 'Forgot Password Requested', module: 'Auth', recordId: String(user._id), ipAddress: req.ip });
  }

  sendSuccess(res, generic);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;
  if (!token || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('Token, new password and confirm password are required.');
  }
  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('New password and confirm password must match.');
  }
  const validationError = validatePassword(newPassword);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } }).select('+password');
  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or expired.');
  }

  user.password = await User.hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.firstLogin = false;
  user.passwordChanged = true;
  user.lastPasswordChangedAt = new Date();
  await user.save();

  await AuditLog.create({ user: user._id, role: user.role, action: 'Password Reset Success', module: 'Auth', recordId: String(user._id), ipAddress: req.ip });
  sendSuccess(res, 'Password reset successful. Please login with your new password.');
});

const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Logout successful.');
});

module.exports = { login, me, changePassword, forgotPassword, resetPassword, logout };
