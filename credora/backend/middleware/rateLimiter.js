const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
});

// Strict rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.'
    });
  }
});

// Transaction rate limiter
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 transactions per minute
  message: {
    success: false,
    message: 'Too many transactions, please wait a moment.'
  },
  handler: (req, res) => {
    logger.warn(`Transaction rate limit exceeded for user: ${req.user?.userId}`);
    res.status(429).json({
      success: false,
      message: 'Transaction rate limit exceeded. Please try again in a minute.'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  transactionLimiter
};