const { redisClient } = require('../config/redis');

const TTL = 300; // 5 minutes

module.exports = (key) => async (req, res, next) => {
  try {
    const cachedPage = await redisClient.get(key);

    if (cachedPage) {
      return res.status(200).send(cachedPage);
    }

    const originalSend = res.send.bind(res);

    res.send = async (body) => {
      await redisClient.setEx(key, TTL, body);
      originalSend(body);
    };

    next();
  } catch (err) {
    next();
  }
};
