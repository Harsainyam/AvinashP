const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Generate JWT token
 */
const generateToken = (payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) => {
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    logger.error('JWT generation error:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error('JWT verification error:', error);
    throw error;
  }
};

/**
 * Decode JWT token without verification (for debugging)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('JWT decode error:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
