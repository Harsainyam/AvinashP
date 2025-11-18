const bcrypt = require('bcrypt');
const crypto = require('crypto');
const logger = require('./logger');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  } catch (error) {
    logger.error('Password hashing error:', error);
    throw error;
  }
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Password comparison error:', error);
    throw error;
  }
};

/**
 * Generate MD5 hash (for demonstration purposes)
 */
const generateMD5 = (input) => {
  return crypto.createHash('md5').update(input).digest('hex');
};

/**
 * Generate SHA256 hash
 */
const generateSHA256 = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

/**
 * Generate secure random string
 */
const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateMD5,
  generateSHA256,
  generateSecureRandom
};
