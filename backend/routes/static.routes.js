const express = require('express');
const redisPageCache = require('../middlewares/redisPageCache');

const router = express.Router();

router.get(
  '/about',
  redisPageCache('page:about'),
  (req, res) => {
    res.send('<h1>About Page</h1><p>Cached using Redis</p>');
  }
);

router.get(
  '/contact',
  redisPageCache('page:contact'),
  (req, res) => {
    res.send('<h1>Contact Page</h1><p>Cached using Redis</p>');
  }
);

module.exports = router;
