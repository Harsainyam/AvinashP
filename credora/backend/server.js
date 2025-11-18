require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const app = require('./app');
const { initializeSocket } = require('./services/socketService');
const { connectMongoDB } = require('./config/mongodb');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize MongoDB first
async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    logger.info('✅ MongoDB initialized successfully');

    // Create server (HTTPS in production, HTTP in development)
    let server;

    if (NODE_ENV === 'production' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
      const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
      const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
      const credentials = { key: privateKey, cert: certificate };
      
      server = https.createServer(credentials, app);
      logger.info('HTTPS Server initialized');
    } else {
      server = http.createServer(app);
      logger.info('HTTP Server initialized (Development Mode)');
    }

    // Initialize WebSocket
    const io = initializeSocket(server);

    // Make io accessible to routes
    app.set('io', io);

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Credora Backend running on port ${PORT}`);
      logger.info(`📡 Environment: ${NODE_ENV}`);
      logger.info(`🔒 Protocol: ${NODE_ENV === 'production' ? 'HTTPS' : 'HTTP'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;