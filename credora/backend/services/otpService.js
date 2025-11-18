
const crypto = require('crypto');
const { setEx, get, del } = require('../config/redis');
const logger = require('../utils/logger');

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_SECONDS) || 60;
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 6;

/**
 * Generate OTP for user
 * @param {string} userId - User ID
 * @returns {string} Generated OTP
 */
const generateOTP = async (userId) => {
  try {
    // Generate random OTP
    const otp = crypto
      .randomInt(0, Math.pow(10, OTP_LENGTH))
      .toString()
      .padStart(OTP_LENGTH, '0');

    // Store in Redis with expiry
    const key = `otp:${userId}`;
    await setEx(key, otp, OTP_EXPIRY);

    logger.info(`OTP generated for user ${userId}`);
    return otp;
  } catch (error) {
    logger.error('OTP generation error:', error);
    throw error;
  }
};

/**
 * Verify OTP for user
 * @param {string} userId - User ID
 * @param {string} otp - OTP to verify
 * @returns {boolean} Verification result
 */
const verifyOTP = async (userId, otp) => {
  try {
    const key = `otp:${userId}`;
    const storedOTP = await get(key);

    if (!storedOTP) {
      logger.warn(`OTP not found or expired for user ${userId}`);
      return false;
    }

    if (storedOTP === otp) {
      // Delete OTP after successful verification
      await del(key);
      logger.info(`OTP verified successfully for user ${userId}`);
      return true;
    }

    logger.warn(`Invalid OTP attempt for user ${userId}`);
    return false;
  } catch (error) {
    logger.error('OTP verification error:', error);
    return false;
  }
};

/**
 * Resend OTP (with rate limiting check)
 * @param {string} userId - User ID
 * @returns {string} New OTP
 */
const resendOTP = async (userId) => {
  try {
    const rateLimitKey = `otp:ratelimit:${userId}`;
    const rateLimitCount = await get(rateLimitKey);

    // Allow max 3 OTP requests in 5 minutes
    if (rateLimitCount && parseInt(rateLimitCount) >= 3) {
      throw new Error('Too many OTP requests. Please try again later.');
    }

    // Generate new OTP
    const otp = await generateOTP(userId);

    // Update rate limit counter
    if (!rateLimitCount) {
      await setEx(rateLimitKey, '1', 300); // 5 minutes
    } else {
      await setEx(rateLimitKey, (parseInt(rateLimitCount) + 1).toString(), 300);
    }

    return otp;
  } catch (error) {
    logger.error('OTP resend error:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  verifyOTP,
  resendOTP
};
