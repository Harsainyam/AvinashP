const { Pool } = require('pg');
const logger = require('../utils/logger');

// PostgreSQL Connection Pool - OPTIMIZED
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  min: parseInt(process.env.PG_POOL_MIN) || 5, // Increased from 2
  max: parseInt(process.env.PG_POOL_MAX) || 20, // Increased from 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased from 2000
  // Performance optimizations
  statement_timeout: 10000, // 10 second query timeout
  query_timeout: 10000,
  application_name: 'credora_backend'
});

// Test connection
pool.on('connect', (client) => {
  logger.info('✅ PostgreSQL connected successfully');
  // Set session-level optimizations
  client.query(`
    SET statement_timeout = '10s';
    SET lock_timeout = '5s';
    SET idle_in_transaction_session_timeout = '30s';
  `).catch(err => logger.error('Failed to set session parameters:', err));
});

pool.on('error', (err) => {
  logger.error('❌ Unexpected error on idle PostgreSQL client', err);
  // Don't exit process, let it recover
});

pool.on('remove', () => {
  logger.debug('PostgreSQL client removed from pool');
});

// Query helper with error handling and metrics
const query = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn('Slow query detected', { 
        duration, 
        text: text.substring(0, 100),
        rows: res.rowCount 
      });
    } else {
      logger.debug('Query executed', { duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query error', { 
      duration,
      text: text.substring(0, 100), 
      error: error.message,
      code: error.code
    });
    throw error;
  } finally {
    client.release();
  }
};

// Transaction helper with optimizations
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Set transaction isolation level for better performance
    await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
const checkHealth = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    return {
      status: 'healthy',
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
      serverTime: result.rows[0].now
    };
  } catch (error) {
    logger.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Graceful shutdown
const close = async () => {
  logger.info('Closing PostgreSQL pool...');
  await pool.end();
  logger.info('PostgreSQL pool closed');
};

process.on('SIGINT', close);
process.on('SIGTERM', close);

module.exports = {
  pool,
  query,
  transaction,
  checkHealth,
  close
};
