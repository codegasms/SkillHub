const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/authMiddleware');
const jobController = require('../controllers/jobController');

// Route to get filtered jobs
router.get('/jobs', authenticateJWT, jobController.getFilteredJobs);

module.exports = router;
