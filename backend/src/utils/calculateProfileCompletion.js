const REQUIRED_FIELDS = [
  'name',
  'email',
  'phone',
  'role',
  'department',
  'address',
  'dateOfBirth',
  'gender',
  'emergencyContactNumber',
  'profilePhoto',
  'aadhaarCard',
  'qualificationDocument',
  'joiningDate',
  'shiftStart',
  'shiftEnd'
];

const calculateProfileCompletion = (user) => {
  const pendingRequiredFields = REQUIRED_FIELDS.filter((field) => {
    const value = user[field];
    return value === undefined || value === null || value === '';
  });
  const completed = REQUIRED_FIELDS.length - pendingRequiredFields.length;
  const profileCompletionPercentage = Math.round((completed / REQUIRED_FIELDS.length) * 100);
  return { profileCompletionPercentage, pendingRequiredFields };
};

module.exports = calculateProfileCompletion;
