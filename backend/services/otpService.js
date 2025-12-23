



const crypto = require('crypto');
const { setEx, get, del } = require('../config/redis');
const logger = require('../utils/logger');

const inMemoryOTP = new Map();


const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_SECONDS) || 60;
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 6;

/**
 * Generate OTP for user
 * @param {string} userId - User ID
 * @returns {string} Generated OTP
 */
const generateOTP = async (userId) => {
  try {
    const otp = crypto
      .randomInt(0, Math.pow(10, OTP_LENGTH))
      .toString()
      .padStart(OTP_LENGTH, '0');

    // ✅ TEST ENV: store in memory
    if (process.env.NODE_ENV === 'test') {
      inMemoryOTP.set(userId, otp);
      logger.info(`[TEST MODE] OTP stored in memory for user ${userId}: ${otp}`);
      return otp;
    }

    // ✅ NORMAL MODE: store in Redis
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
    // ✅ TEST ENV
    if (process.env.NODE_ENV === 'test') {
      const storedOTP = inMemoryOTP.get(userId);

      if (!storedOTP) {
        logger.warn(`[TEST MODE] OTP not found for user ${userId}`);
        return false;
      }

      if (storedOTP === otp) {
        inMemoryOTP.delete(userId);
        logger.info(`[TEST MODE] OTP verified for user ${userId}`);
        return true;
      }

      logger.warn(`[TEST MODE] Invalid OTP attempt for user ${userId}`);
      return false;
    }

    // ✅ NORMAL MODE (Redis)
    const key = `otp:${userId}`;
    const storedOTP = await get(key);

    if (!storedOTP) {
      logger.warn(`OTP not found or expired for user ${userId}`);
      return false;
    }

    if (storedOTP === otp) {
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
