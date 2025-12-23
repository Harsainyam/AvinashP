const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

// GET /api/about - Get About Us page (cached with Redis)
router.get('/', aboutController.getAboutUs);

// DELETE /api/about/cache - Clear cache (for testing/updates)
router.delete('/cache', aboutController.clearAboutCache);

module.exports = router;