const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/credora_logs';
const dbName = process.env.MONGO_DB_NAME || 'credora_logs';

let client;
let db;

const connectMongoDB = async () => {
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(dbName);
    
    logger.info('✅ MongoDB connected successfully');
    
    // Create indexes
    await createIndexes();
    
    return db;
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

const createIndexes = async () => {
  try {
    // Logs collection indexes
    await db.collection('logs').createIndexes([
      { key: { userId: 1, timestamp: -1 } },
      { key: { action: 1 } },
      { key: { timestamp: -1 } },
      { key: { status: 1 } }
    ]);

    // Analytics collection indexes
    await db.collection('analytics').createIndexes([
      { key: { date: -1 }, unique: true }
    ]);

    // Audit trail collection indexes
    await db.collection('audit_trail').createIndexes([
      { key: { entityId: 1, timestamp: -1 } },
      { key: { performedBy: 1 } },
      { key: { entityType: 1 } }
    ]);

    logger.info('📊 MongoDB indexes created');
  } catch (error) {
    logger.error('Error creating MongoDB indexes:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectMongoDB first.');
  }
  return db;
};

const closeMongoDB = async () => {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
};

module.exports = {
  connectMongoDB,
  getDB,
  closeMongoDB
};