const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Signup validation
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth is required'),
  validate
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// OTP validation
const otpValidation = [
  body('userId')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Valid 6-digit OTP is required'),
  validate
];

// Transaction validation
const transactionValidation = [
  body('fromAccountId')
    .isUUID()
    .withMessage('Valid from account ID is required'),
  body('toAccountNumber')
    .isLength({ min: 10, max: 20 })
    .withMessage('Valid account number is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  validate
];

// UUID param validation
const uuidParamValidation = [
  param('accountId')
    .optional()
    .isUUID()
    .withMessage('Valid UUID is required'),
param('transactionId')
.optional()
.isUUID()
.withMessage('Valid UUID is required'),
validate
];
module.exports = {
validate,
signupValidation,
loginValidation,
otpValidation,
transactionValidation,
uuidParamValidation
};