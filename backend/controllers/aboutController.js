const { setEx, get } = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_KEY = 'page:about';
const CACHE_TTL = 3600; // 1 hour

/**
 * Get About Us page content
 * Demonstrates Redis caching with a static page
 */
const getAboutUs = async (req, res, next) => {
  try {
    // Try to get from cache first
    const cachedContent = await get(CACHE_KEY);
    
    if (cachedContent) {
      logger.info('About Us page served from Redis cache');
      return res.status(200).json({
        success: true,
        data: cachedContent,
        cached: true,
        message: 'Content served from cache'
      });
    }

    // If not in cache, generate the content
    logger.info('About Us page cache miss - generating content');
    
    const aboutContent = {
      title: 'About Credora Bank',
      mission: 'Empowering your financial future with secure, innovative banking solutions.',
      description: 'Credora Bank is a modern digital banking platform built with cutting-edge technology to provide seamless, secure, and efficient banking services.',
      features: [
        {
          icon: '🔒',
          title: 'Security First',
          description: 'Bank-grade encryption and multi-factor authentication protect your assets.'
        },
        {
          icon: '⚡',
          title: 'Lightning Fast',
          description: 'Real-time transactions and instant notifications keep you in control.'
        },
        {
          icon: '📱',
          title: 'Mobile Ready',
          description: 'Access your accounts anytime, anywhere with our responsive platform.'
        },
        {
          icon: '💡',
          title: 'Smart Banking',
          description: 'AI-powered insights help you make better financial decisions.'
        }
      ],
      team: [
        {
          name: 'Development Team',
          role: 'Full-Stack Engineers',
          description: 'Building the future of digital banking'
        },
        {
          name: 'Security Team',
          role: 'Cybersecurity Experts',
          description: 'Protecting your financial data 24/7'
        },
        {
          name: 'Support Team',
          role: 'Customer Success',
          description: 'Here to help whenever you need us'
        }
      ],
      stats: {
        users: '10,000+',
        transactions: '1M+',
        uptime: '99.9%',
        countries: '25+'
      },
      contact: {
        email: 'support@credora.com',
        phone: '+1 (555) 123-4567',
        address: '123 Banking Street, Financial District, NY 10001'
      },
      lastUpdated: new Date().toISOString()
    };

    // Cache the content
    await setEx(CACHE_KEY, aboutContent, CACHE_TTL);
    logger.info(`About Us page cached in Redis with TTL ${CACHE_TTL}s`);

    res.status(200).json({
      success: true,
      data: aboutContent,
      cached: false,
      message: 'Content generated and cached'
    });

  } catch (error) {
    logger.error('Get About Us error:', error);
    next(error);
  }
};

/**
 * Clear About Us cache
 * Useful when content needs to be updated
 */
const clearAboutCache = async (req, res, next) => {
  try {
    const { del } = require('../config/redis');
    await del(CACHE_KEY);
    
    logger.info('About Us cache cleared');
    
    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    logger.error('Clear cache error:', error);
    next(error);
  }
};

module.exports = {
  getAboutUs,
  clearAboutCache
};