const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { generateToken, verifyToken } = require('../utils/jwtHelper');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const otpService = require('../services/otpService');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { getDB } = require('../config/mongodb');

// Signup Controller
const signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, dateOfBirth, address } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and account in a transaction
    const result = await transaction(async (client) => {
      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, first_name, last_name, created_at`,
        [email, passwordHash, firstName, lastName, phone, dateOfBirth, address]
      );

      const user = userResult.rows[0];

      // Create default account
      const accountNumber = '100' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      
      const accountResult = await client.query(
        `INSERT INTO accounts (user_id, account_number, account_type, balance)
         VALUES ($1, $2, $3, $4)
         RETURNING id, account_number, account_type, balance`,
        [user.id, accountNumber, 'savings', 1000.00]
      );

      return {
        user,
        account: accountResult.rows[0]
      };
    });

    // Log to MongoDB
    const db = getDB();
    await db.collection('logs').insertOne({
      userId: result.user.id,
      action: 'signup',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      timestamp: new Date()
    });

    // Generate OTP and send
    const otp = await otpService.generateOTP(result.user.id);
    // In production, send OTP via email/SMS
    logger.info(`OTP for ${email}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please verify OTP sent to your email.',
      data: {
        userId: result.user.id,
        email: result.user.email,
        accountNumber: result.account.account_number
      }
    });

  } catch (error) {
    logger.error('Signup error:', error);
    next(error);
  }
};

// Login Controller
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get user
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, is_active, failed_login_attempts
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.failed_login_attempts >= 5) {
      return res.status(423).json({
        success: false,
        message: 'Account locked due to multiple failed login attempts. Please contact support.'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed attempts
      await query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
        [user.id]
      );

      // Log failed attempt
      const db = getDB();
      await db.collection('logs').insertOne({
        userId: user.id,
        action: 'login',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failed',
        reason: 'invalid_password',
        timestamp: new Date()
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset failed attempts and update last login
    await query(
      'UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate OTP for two-factor authentication
    const otp = await otpService.generateOTP(user.id);
    logger.info(`OTP for ${email}: ${otp}`);

    // Log successful login attempt (OTP sent)
    const db = getDB();
    await db.collection('logs').insertOne({
      userId: user.id,
      action: 'login_otp_sent',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete login.',
      data: {
        userId: user.id,
        email: user.email,
        requiresOTP: true
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// Verify OTP Controller
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    // Verify OTP
    const isValid = await otpService.verifyOTP(userId, otp);

    if (!isValid) {
      // Log failed OTP verification
      const db = getDB();
      await db.collection('logs').insertOne({
        userId,
        action: 'otp_verification',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failed',
        timestamp: new Date()
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Get user details
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name,
              json_agg(json_build_object(
                'id', a.id,
                'accountNumber', a.account_number,
                'accountType', a.account_type,
                'balance', a.balance,
                'currency', a.currency
              )) as accounts
       FROM users u
       LEFT JOIN accounts a ON u.id = a.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    const user = result.rows[0];

    // Generate JWT tokens
    const accessToken = generateToken({ userId: user.id, email: user.email });
    const refreshToken = generateToken(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      process.env.JWT_REFRESH_EXPIRES_IN
    );

    // Cache user data in Redis
    await cacheService.cacheUserProfile(user.id, {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      accounts: user.accounts
    });

    // Log successful login
    const db = getDB();
    await db.collection('logs').insertOne({
      userId,
      action: 'login',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          accounts: user.accounts
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    next(error);
  }
};

// Logout Controller
const logout = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Invalidate cache
    await cacheService.invalidateUserCache(userId);

    // Log logout
    const db = getDB();
    await db.collection('logs').insertOne({
      userId,
      action: 'logout',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

// Refresh Token Controller
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const newAccessToken = generateToken({
      userId: decoded.userId,
      email: decoded.email
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

module.exports = {
  signup,
  login,
  verifyOTP,
  logout,
  refreshToken
};