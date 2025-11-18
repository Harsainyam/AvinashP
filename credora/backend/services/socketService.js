const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwtHelper');
const logger = require('../utils/logger');
const { redisClient } = require('../config/redis');

let io;

/**
 * Initialize Socket.IO server
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Redis adapter for scaling (optional)
  // const { createAdapter } = require('@socket.io/redis-adapter');
  // const pubClient = redisClient.duplicate();
  // const subClient = redisClient.duplicate();
  // io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.email = decoded.email;
      
      logger.info(`Socket authenticated for user ${decoded.userId}`);
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Join user-specific room
    socket.join(socket.userId);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Credora real-time service',
      userId: socket.userId
    });

    // Handle custom events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
};

/**
 * Emit transaction notification to user
 */
const emitTransactionNotification = (userId, data) => {
  if (io) {
    io.to(userId).emit('transaction', data);
    logger.debug(`Transaction notification sent to user ${userId}`);
  }
};

/**
 * Emit account update to user
 */
const emitAccountUpdate = (userId, data) => {
  if (io) {
    io.to(userId).emit('accountUpdate', data);
    logger.debug(`Account update sent to user ${userId}`);
  }
};

/**
 * Broadcast system notification
 */
const broadcastSystemNotification = (data) => {
  if (io) {
    io.emit('systemNotification', data);
    logger.info('System notification broadcasted');
  }
};

/**
 * Get connected clients count
 */
const getConnectedClientsCount = () => {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
};

module.exports = {
  initializeSocket,
  emitTransactionNotification,
  emitAccountUpdate,
  broadcastSystemNotification,
  getConnectedClientsCount
};
