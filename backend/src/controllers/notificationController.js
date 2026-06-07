const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const rows = await Notification.find({
    $or: [
      { targetUsers: req.user._id },
      { targetRoles: req.user.role },
      { targetUsers: { $size: 0 }, targetRoles: { $size: 0 } }
    ]
  }).sort({ createdAt: -1 }).limit(Number(req.query.limit || 50));
  const data = rows.map((n) => ({ ...n.toObject(), isRead: n.readBy.map(String).includes(String(req.user._id)) }));
  sendSuccess(res, 'Notifications fetched.', data);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } }, { new: true });
  if (!notification) { res.status(404); throw new Error('Notification not found.'); }
  sendSuccess(res, 'Notification marked as read.', notification);
});

module.exports = { getNotifications, markRead };
