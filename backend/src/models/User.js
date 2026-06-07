const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLE_VALUES, ROLES } = require('../utils/roles');

const otherDocumentSchema = new mongoose.Schema({
  documentName: { type: String, trim: true },
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLE_VALUES, default: ROLES.RECEPTION },
  department: { type: String, trim: true, default: 'General' },
  address: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  emergencyContactNumber: String,
  profilePhoto: String,
  aadhaarCard: String,
  qualificationDocument: String,
  experienceDocument: String,
  otherDocuments: [otherDocumentSchema],
  joiningDate: Date,
  shiftStart: String,
  shiftEnd: String,
  isActive: { type: Boolean, default: true },
  firstLogin: { type: Boolean, default: true },
  passwordChanged: { type: Boolean, default: false },
  profileCompletionPercentage: { type: Number, default: 0 },
  pendingRequiredFields: [String],
  verificationStatus: {
    type: String,
    enum: ['New Employee', 'Document Pending', 'Verification Pending', 'Verified', 'Rejected'],
    default: 'New Employee'
  },
  verificationRemark: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastPasswordChangedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);
