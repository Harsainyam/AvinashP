const redis = require('redis');
const logger = require('../utils/logger');

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0,
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

redisClient.on('ready', () => {
  logger.info('🔴 Redis is ready to accept commands');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

// Helper functions
const redisHelpers = {
  // Set with expiry (TTL in seconds)
  setEx: async (key, value, ttl) => {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis setEx error:', error);
      return false;
    }
  },

  // Get value
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  // Delete key
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },

  // Get TTL
  ttl: async (key) => {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error);
      return -1;
    }
  }
};

module.exports = {
  redisClient,
  ...redisHelpers
};