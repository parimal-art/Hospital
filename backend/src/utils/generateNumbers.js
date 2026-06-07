const dayjs = require('dayjs');

const generateNumber = async (Model, fieldName, prefix) => {
  const datePart = dayjs().format('YYYYMMDD');
  const count = await Model.countDocuments({ [fieldName]: { $regex: `^${prefix}${datePart}` } });
  return `${prefix}${datePart}${String(count + 1).padStart(4, '0')}`;
};

module.exports = { generateNumber };
