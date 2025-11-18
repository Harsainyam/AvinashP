const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware');
const { uuidParamValidation } = require('../middleware/validator');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/accounts - Get all user accounts
router.get('/', accountController.getUserAccounts);

// GET /api/accounts/:accountId - Get specific account details
router.get('/:accountId', uuidParamValidation, accountController.getAccountDetails);

// GET /api/accounts/:accountId/balance - Get account balance
router.get('/:accountId/balance', uuidParamValidation, accountController.getAccountBalance);

module.exports = router;
