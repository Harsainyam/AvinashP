const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { getDB } = require('../config/mongodb');

// Create Transaction (Transfer) - OPTIMIZED VERSION
const createTransaction = async (req, res, next) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = req.body;
    const userId = req.user.userId;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero'
      });
    }

    // Generate reference number upfront
    const referenceNumber = 'TXN' + Date.now() + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Perform transaction in database transaction
    const result = await transaction(async (client) => {
      // OPTIMIZED: Single query to verify from account with row lock
      const fromAccountResult = await client.query(
        `SELECT id, balance, account_number, user_id 
         FROM accounts 
         WHERE id = $1 AND user_id = $2 AND status = 'active'
         FOR UPDATE`, // Row-level lock to prevent race conditions
        [fromAccountId, userId]
      );

      if (fromAccountResult.rows.length === 0) {
        throw new Error('Source account not found or unauthorized');
      }

      const fromAccount = fromAccountResult.rows[0];

      // Check sufficient balance
      if (fromAccount.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // OPTIMIZED: Get destination account with row lock
      const toAccountResult = await client.query(
        `SELECT id, account_number, user_id 
         FROM accounts 
         WHERE account_number = $1 AND status = 'active'
         FOR UPDATE`,
        [toAccountNumber]
      );

      if (toAccountResult.rows.length === 0) {
        throw new Error('Destination account not found');
      }

      const toAccount = toAccountResult.rows[0];

      // Prevent self-transfer
      if (fromAccount.id === toAccount.id) {
        throw new Error('Cannot transfer to the same account');
      }

      // Calculate new balance
      const balanceAfter = parseFloat(fromAccount.balance) - parseFloat(amount);

      // OPTIMIZED: Batch update both accounts in single query
      await client.query(
        `UPDATE accounts 
         SET balance = CASE 
           WHEN id = $1 THEN balance - $3
           WHEN id = $2 THEN balance + $3
         END,
         updated_at = CURRENT_TIMESTAMP
         WHERE id IN ($1, $2)`,
        [fromAccount.id, toAccount.id, amount]
      );

      // Create transaction record
      const transactionResult = await client.query(
        `INSERT INTO transactions (
           from_account_id, to_account_id, transaction_type, amount, 
           status, description, reference_number, balance_after
         )
         VALUES ($1, $2, 'transfer', $3, 'completed', $4, $5, $6)
         RETURNING id, created_at`,
        [fromAccount.id, toAccount.id, amount, description, referenceNumber, balanceAfter]
      );

      return {
        transactionId: transactionResult.rows[0].id,
        createdAt: transactionResult.rows[0].created_at,
        fromAccountNumber: fromAccount.account_number,
        toAccountNumber: toAccount.account_number,
        balanceAfter,
        toUserId: toAccount.user_id
      };
    });

    // Send response immediately (don't wait for cache/logs)
    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        referenceNumber,
        amount,
        balanceAfter: result.balanceAfter,
        timestamp: result.createdAt
      }
    });

    // Async operations after response (non-blocking)
    setImmediate(async () => {
      try {
        // Invalidate cache for both users
        await Promise.all([
          cacheService.invalidateUserCache(userId),
          cacheService.invalidateUserCache(result.toUserId)
        ]);

        // Log to MongoDB
        const db = getDB();
        await db.collection('logs').insertOne({
          userId,
          action: 'transfer',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
          metadata: {
            amount,
            fromAccount: result.fromAccountNumber,
            toAccount: result.toAccountNumber,
            referenceNumber
          },
          timestamp: new Date()
        });

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
          // Notify sender
          io.to(userId).emit('transaction', {
            type: 'transfer_sent',
            amount,
            status: 'completed',
            referenceNumber,
            timestamp: new Date()
          });

          // Notify receiver
          io.to(result.toUserId).emit('transaction', {
            type: 'transfer_received',
            amount,
            status: 'completed',
            referenceNumber,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error('Post-transaction operations error:', error);
      }
    });

  } catch (error) {
    logger.error('Transaction error:', error);
    
    // Log failed transaction asynchronously
    setImmediate(async () => {
      try {
        const db = getDB();
        await db.collection('logs').insertOne({
          userId: req.user.userId,
          action: 'transfer',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failed',
          metadata: {
            error: error.message
          },
          timestamp: new Date()
        });
      } catch (logError) {
        logger.error('Failed to log error:', logError);
      }
    });

    return res.status(400).json({
      success: false,
      message: error.message || 'Transaction failed'
    });
  }
};

// Get Transaction History - OPTIMIZED VERSION
const getTransactionHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { accountId, limit = 50, offset = 0, type } = req.query;

    // Try cache first
    const cacheKey = `transactions:${userId}:${accountId}:${limit}:${offset}:${type || 'all'}`;
    const cachedData = await cacheService.get(cacheKey);
    
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // OPTIMIZED: Single query with EXPLAIN ANALYZE friendly structure
    let queryText = `
      SELECT 
        t.id, 
        t.transaction_type, 
        t.amount, 
        t.currency, 
        t.status, 
        t.description, 
        t.reference_number, 
        t.balance_after, 
        t.created_at,
        CASE 
          WHEN t.from_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
          THEN fa.account_number
          ELSE NULL
        END as from_account_number,
        CASE 
          WHEN t.to_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
          THEN ta.account_number
          ELSE NULL
        END as to_account_number
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      WHERE (
        t.from_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
        OR t.to_account_id IN (SELECT id FROM accounts WHERE user_id = $1)
      )
    `;

    const params = [userId];
    let paramCount = 1;

    if (accountId) {
      paramCount++;
      queryText += ` AND (t.from_account_id = $${paramCount} OR t.to_account_id = $${paramCount})`;
      params.push(accountId);
    }

    if (type) {
      paramCount++;
      queryText += ` AND t.transaction_type = $${paramCount}`;
      params.push(type);
    }

    queryText += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    // Cache the result asynchronously
    setImmediate(async () => {
      try {
        await cacheService.setEx(cacheKey, result.rows, 300); // 5 minutes TTL
      } catch (error) {
        logger.error('Cache set error:', error);
      }
    });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });

  } catch (error) {
    logger.error('Get transaction history error:', error);
    next(error);
  }
};

// Get Transaction Details
const getTransactionDetails = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT t.*, 
              fa.account_number as from_account_number,
              ta.account_number as to_account_number,
              u1.first_name || ' ' || u1.last_name as from_account_holder,
              u2.first_name || ' ' || u2.last_name as to_account_holder
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       LEFT JOIN users u1 ON fa.user_id = u1.id
       LEFT JOIN users u2 ON ta.user_id = u2.id
       WHERE t.id = $1 AND (fa.user_id = $2 OR ta.user_id = $2)`,
      [transactionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Get transaction details error:', error);
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactionHistory,
  getTransactionDetails
};
