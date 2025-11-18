
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  signupValidation,
  loginValidation,
  otpValidation
} = require('../middleware/validator');

// POST /api/auth/signup
router.post('/signup', authLimiter, signupValidation, authController.signup);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, authController.login);

// POST /api/auth/verify-otp
router.post('/verify-otp', authLimiter, otpValidation, authController.verifyOTP);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
