const express = require('express');
const router = express.Router();
const solrService = require('../services/solrService');

// System health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      services: {
        solr: { status: 'unknown' },
        redis: { status: 'unknown' },
        mongodb: { status: 'unknown' }
      }
    };
    
    // Check Solr health
    try {
      // Try a simple query to check if Solr is responding
      await solrService.searchJobs('*:*', { limit: 1 });
      health.services.solr.status = 'up';
    } catch (error) {
      health.services.solr.status = 'down';
      health.services.solr.error = error.message;
    }
    
    // Check Redis health
    try {
      const redisClient = req.app.get('redisClient');
      if (redisClient && !global.isRedisManuallyDisabled) {
        await redisClient.ping();
        health.services.redis.status = 'up';
      } else {
        health.services.redis.status = 'disabled';
      }
    } catch (error) {
      health.services.redis.status = 'down';
      health.services.redis.error = error.message;
    }
    
    // Check MongoDB health
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        health.services.mongodb.status = 'up';
      } else {
        health.services.mongodb.status = 'down';
      }
    } catch (error) {
      health.services.mongodb.status = 'down';
      health.services.mongodb.error = error.message;
    }
    
    // Determine overall status
    const isHealthy = health.services.mongodb.status === 'up'; // Only MongoDB is critical
    
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;