const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send OTP email
 */
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Credora - Your OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { background: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; border: 2px dashed #667eea; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏦 Credora Banking</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>Your One-Time Password (OTP) for authentication is:</p>
              <div class="otp-code">${otp}</div>
              <p><strong>This OTP will expire in 60 seconds.</strong></p>
              <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
              <p>Best regards,<br>Credora Security Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2025 Credora. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Send OTP email error:', error);
    return false;
  }
};

/**
 * Send transaction confirmation email
 */
const sendTransactionEmail = async (email, transactionData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Credora - Transaction Confirmation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .transaction-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .amount { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Transaction Successful</h1>
            </div>
            <div class="content">
              <h2>Transaction Confirmation</h2>
              <div class="amount">$${transactionData.amount.toFixed(2)}</div>
              <div class="transaction-details">
                <div class="detail-row">
                  <span class="label">Reference Number:</span>
                  <span class="value">${transactionData.referenceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date & Time:</span>
                  <span class="value">${new Date(transactionData.timestamp).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Type:</span>
                  <span class="value">${transactionData.type}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value">${transactionData.status}</span>
                </div>
              </div>
              <p>If you did not authorize this transaction, please contact us immediately.</p>
              <p>Best regards,<br>Credora Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Transaction email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Send transaction email error:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendTransactionEmail
};
