const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const { transactionLimiter } = require('../middleware/rateLimiter');
const {
  transactionValidation,
  uuidParamValidation
} = require('../middleware/validator');

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/transactions - Create new transaction
router.post(
  '/',
  transactionLimiter,
  transactionValidation,
  transactionController.createTransaction
);

// GET /api/transactions - Get transaction history
router.get('/', transactionController.getTransactionHistory);

// GET /api/transactions/:transactionId - Get transaction details
router.get(
  '/:transactionId',
  uuidParamValidation,
  transactionController.getTransactionDetails
);

module.exports = router;
