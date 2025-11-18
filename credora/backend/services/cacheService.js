const { setEx, get, del } = require('../config/redis');
const logger = require('../utils/logger');

const DEFAULT_TTL = 3600; // 1 hour
const PROFILE_TTL = 7200; // 2 hours
const TRANSACTION_TTL = 300; // 5 minutes

/**
 * Cache user profile
 */
const cacheUserProfile = async (userId, profileData) => {
  try {
    const key = `user:profile:${userId}`;
    await setEx(key, profileData, PROFILE_TTL);
    logger.debug(`Cached user profile for ${userId}`);
  } catch (error) {
    logger.error('Cache user profile error:', error);
  }
};

/**
 * Get cached user profile
 */
const getCachedUserProfile = async (userId) => {
  try {
    const key = `user:profile:${userId}`;
    return await get(key);
  } catch (error) {
    logger.error('Get cached user profile error:', error);
    return null;
  }
};

/**
 * Cache user accounts
 */
const cacheUserAccounts = async (userId, accounts) => {
  try {
    const key = `user:accounts:${userId}`;
    await setEx(key, accounts, PROFILE_TTL);
    logger.debug(`Cached accounts for user ${userId}`);
  } catch (error) {
    logger.error('Cache user accounts error:', error);
  }
};

/**
 * Get cached user accounts
 */
const getCachedUserAccounts = async (userId) => {
  try {
    const key = `user:accounts:${userId}`;
    return await get(key);
  } catch (error) {
    logger.error('Get cached user accounts error:', error);
    return null;
  }
};

/**
 * Cache transactions
 */
const cacheTransactions = async (cacheKey, transactions, ttl = TRANSACTION_TTL) => {
  try {
    await setEx(cacheKey, transactions, ttl);
    logger.debug(`Cached transactions with key ${cacheKey}`);
  } catch (error) {
    logger.error('Cache transactions error:', error);
  }
};

/**
 * Invalidate user cache
 */
const invalidateUserCache = async (userId) => {
  try {
    await del(`user:profile:${userId}`);
    await del(`user:accounts:${userId}`);
    logger.info(`Invalidated cache for user ${userId}`);
  } catch (error) {
    logger.error('Invalidate user cache error:', error);
  }
};

module.exports = {
  cacheUserProfile,
  getCachedUserProfile,
  cacheUserAccounts,
  getCachedUserAccounts,
  cacheTransactions,
  invalidateUserCache,
  setEx,
  get,
  del
};
