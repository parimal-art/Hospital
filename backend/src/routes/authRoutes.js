const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, me, changePassword, forgotPassword, resetPassword, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { success: false, message: 'Too many forgot password requests. Please try again later.', data: null } });

router.post('/login', login);
router.get('/me', protect, me);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', protect, logout);

module.exports = router;
