const { query } = require('../config/database');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

// Get User Accounts
const getUserAccounts = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Try cache first
    const cachedAccounts = await cacheService.getCachedUserAccounts(userId);
    if (cachedAccounts) {
      return res.status(200).json({
        success: true,
        data: cachedAccounts,
        cached: true
      });
    }

    // Query database
    const result = await query(
      `SELECT id, account_number, account_type, balance, currency, status, created_at
       FROM accounts
       WHERE user_id = $1 AND status != 'closed'
       ORDER BY created_at DESC`,
      [userId]
    );

    // Cache the result
    await cacheService.cacheUserAccounts(userId, result.rows);

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    logger.error('Get accounts error:', error);
    next(error);
  }
};

// Get Account Details
const getAccountDetails = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT a.id, a.account_number, a.account_type, a.balance, a.currency, 
              a.status, a.overdraft_limit, a.created_at,
              u.first_name, u.last_name, u.email
       FROM accounts a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Get account details error:', error);
    next(error);
  }
};

// Get Account Balance
const getAccountBalance = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT balance, currency, account_number
       FROM accounts
       WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Get balance error:', error);
    next(error);
  }
};

module.exports = {
  getUserAccounts,
  getAccountDetails,
  getAccountBalance
};