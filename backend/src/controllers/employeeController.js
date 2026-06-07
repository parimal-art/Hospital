const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Notification = require('../models/Notification');
const DocumentUpload = require('../models/DocumentUpload');
const asyncHandler = require('../utils/asyncHandler');
const calculateProfileCompletion = require('../utils/calculateProfileCompletion');
const validatePassword = require('../utils/passwordValidator');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');
const { ROLES } = require('../utils/roles');

const pickUpdatableFields = (body) => {
  const fields = [
    'name', 'phone', 'role', 'department', 'address', 'dateOfBirth', 'gender', 'emergencyContactNumber',
    'joiningDate', 'shiftStart', 'shiftEnd', 'isActive', 'verificationStatus', 'verificationRemark'
  ];
  const update = {};
  fields.forEach((field) => {
    if (body[field] !== undefined) update[field] = body[field];
  });
  return update;
};

const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, phone, role, department, defaultPassword, joiningDate, shiftStart, shiftEnd, isActive } = req.body;
  if (!name || !email || !role || !defaultPassword) {
    res.status(400);
    throw new Error('Name, email, role and default password are required.');
  }
  const validationError = validatePassword(defaultPassword);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const employee = new User({
    name,
    email,
    phone,
    role,
    department,
    joiningDate,
    shiftStart,
    shiftEnd,
    isActive: isActive !== undefined ? isActive : true,
    password: await User.hashPassword(defaultPassword),
    firstLogin: true,
    passwordChanged: false,
    createdBy: req.user._id
  });
  Object.assign(employee, calculateProfileCompletion(employee));
  await employee.save();

  await Notification.create({
    title: 'New employee created',
    message: `${employee.name} was created and must change password on first login.`,
    module: 'Employees',
    recordId: String(employee._id),
    targetRoles: [ROLES.ADMIN],
    createdBy: req.user._id
  });
  await logAudit({ req, action: 'Employee Created', module: 'Employees', recordId: employee._id, newData: employee.toObject() });
  sendSuccess(res, 'Employee created successfully.', employee, 201);
});

const getEmployees = asyncHandler(async (req, res) => {
  const { search, role, isActive, verificationStatus } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';
  if (verificationStatus) query.verificationStatus = verificationStatus;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }
  const employees = await User.find(query).select('-password').sort({ createdAt: -1 });
  sendSuccess(res, 'Employees fetched.', employees);
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id).select('-password').populate('verifiedBy', 'name email');
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  sendSuccess(res, 'Employee fetched.', employee);
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }

  const oldData = employee.toObject();
  const update = pickUpdatableFields(req.body);
  if (req.user.role !== ROLES.ADMIN) {
    delete update.role;
    delete update.isActive;
    delete update.verificationStatus;
    delete update.verificationRemark;
  }
  Object.assign(employee, update);
  Object.assign(employee, calculateProfileCompletion(employee));
  await employee.save();

  await logAudit({ req, action: 'Employee Updated', module: 'Employees', recordId: employee._id, oldData, newData: employee.toObject() });
  sendSuccess(res, 'Employee updated successfully.', employee);
});

const updateStatus = asyncHandler(async (req, res) => {
  const employee = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }).select('-password');
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  await logAudit({ req, action: employee.isActive ? 'Employee Activated' : 'Employee Deactivated', module: 'Employees', recordId: employee._id, newData: { isActive: employee.isActive } });
  sendSuccess(res, 'Employee status updated.', employee);
});

const verifyEmployee = asyncHandler(async (req, res) => {
  const { verificationStatus, verificationRemark } = req.body;
  if (!['Document Pending', 'Verification Pending', 'Verified', 'Rejected'].includes(verificationStatus)) {
    res.status(400);
    throw new Error('Invalid verification status.');
  }
  const employee = await User.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  employee.verificationStatus = verificationStatus;
  employee.verificationRemark = verificationRemark || '';
  employee.verifiedBy = req.user._id;
  employee.verifiedAt = new Date();
  await employee.save();
  await logAudit({ req, action: 'Employee Verification Updated', module: 'Employees', recordId: employee._id, newData: { verificationStatus, verificationRemark } });
  sendSuccess(res, 'Employee verification updated.', employee);
});

const resetEmployeePassword = asyncHandler(async (req, res) => {
  const { defaultPassword } = req.body;
  const validationError = validatePassword(defaultPassword);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }
  const employee = await User.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  employee.password = await User.hashPassword(defaultPassword);
  employee.firstLogin = true;
  employee.passwordChanged = false;
  await employee.save();
  await logAudit({ req, action: 'Employee Password Reset', module: 'Employees', recordId: employee._id });
  sendSuccess(res, 'Employee password reset. Employee must change password on next login.');
});

const uploadEmployeeDocuments = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  const fileUrl = (file) => file ? `/uploads/${file.filename}` : undefined;
  if (req.files?.profilePhoto?.[0]) employee.profilePhoto = fileUrl(req.files.profilePhoto[0]);
  if (req.files?.aadhaarCard?.[0]) employee.aadhaarCard = fileUrl(req.files.aadhaarCard[0]);
  if (req.files?.qualificationDocument?.[0]) employee.qualificationDocument = fileUrl(req.files.qualificationDocument[0]);
  if (req.files?.experienceDocument?.[0]) employee.experienceDocument = fileUrl(req.files.experienceDocument[0]);
  if (req.files?.otherDocument?.[0]) {
    const file = req.files.otherDocument[0];
    employee.otherDocuments.push({ documentName: req.body.documentName || file.originalname, fileUrl: fileUrl(file) });
  }
  employee.verificationStatus = 'Verification Pending';
  Object.assign(employee, calculateProfileCompletion(employee));
  await employee.save();

  const uploadedFiles = Object.values(req.files || {}).flat();
  await Promise.all(uploadedFiles.map((file) => DocumentUpload.create({
    employee: employee._id,
    documentType: 'Employee Document',
    fileUrl: `/uploads/${file.filename}`,
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    description: req.body.documentName || 'Employee document',
    uploadedBy: req.user._id
  })));

  await Notification.create({
    title: 'Employee documents uploaded',
    message: `${employee.name} uploaded profile documents for verification.`,
    module: 'Employees',
    recordId: String(employee._id),
    targetRoles: [ROLES.ADMIN],
    createdBy: req.user._id
  });
  await logAudit({ req, action: 'Employee Documents Uploaded', module: 'Employees', recordId: employee._id });
  sendSuccess(res, 'Documents uploaded successfully.', employee);
});

const profilePdf = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id).select('-password');
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="employee-${employee._id}.pdf"`);
  doc.pipe(res);
  doc.fontSize(18).text('Clinic ERP - Employee Profile', { align: 'center' });
  doc.moveDown();
  const rows = [
    ['Name', employee.name], ['Email', employee.email], ['Phone', employee.phone || '-'], ['Role', employee.role],
    ['Department', employee.department || '-'], ['Status', employee.isActive ? 'Active' : 'Inactive'],
    ['Verification', employee.verificationStatus], ['Profile Completion', `${employee.profileCompletionPercentage}%`],
    ['Joining Date', employee.joiningDate ? employee.joiningDate.toDateString() : '-'],
    ['Shift', `${employee.shiftStart || '-'} to ${employee.shiftEnd || '-'}`], ['Address', employee.address || '-']
  ];
  rows.forEach(([k, v]) => doc.fontSize(11).text(`${k}: ${v}`));
  doc.end();
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  updateStatus,
  verifyEmployee,
  resetEmployeePassword,
  uploadEmployeeDocuments,
  profilePdf
};
