const Job = require("../models/job");
const Bid = require("../models/bid");
const Notification = require("../models/notification");
const User = require("../models/user");
const solrService = require('../services/solrService');
const { getAsync, setAsync } = require("../config/redis"); // Corrected import

const CACHE_EXPIRATION = 60; // Cache duration in seconds (e.g., 60 seconds)

// Create a new job
const createJob = async (req, res) => {
  try {
    const { title, description, budget, categories, skillsRequired } = req.body;
    const employer = req.user.id;

    const newJob = new Job({
      title,
      description,
      budget,
      employer,
      categories,
      skillsRequired,
    });

    await newJob.save();

    // Find freelancers with matching skills and notify them
    const matchingFreelancers = await User.find({
      role: "freelancer",
      skills: { $in: skillsRequired },
    });

    // Create notifications for matching freelancers
    const notifications = matchingFreelancers.map((freelancer) => ({
      recipient: freelancer._id,
      type: "job",
      title: "New Job Matching Your Skills",
      message: `New job posted: ${title} - Budget: $${budget}`,
      relatedId: newJob._id,
      onModel: "Job",
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(newJob);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating job" });
  }
};

// Get jobs for marketplace with Redis Caching
const getMarketplaceJobs = async (req, res) => {
  const cacheKey = "marketplace_jobs";

  try {
    // Check if our special debug route should bypass Redis
    if (req.query.bypassCache === "true" || global.isRedisManuallyDisabled) {
      console.log("Bypassing cache as requested");
      const jobs = await Job.find({ status: "open" });
      res.setHeader("Content-Type", "application/json");
      res.status(200);
      return res.end(JSON.stringify(jobs));
    }

    // 1. Try to get data from Redis cache
    const cachedJobs = await getAsync(cacheKey);

    if (cachedJobs && typeof cachedJobs === "string") {
      console.log("Cache hit for marketplace_jobs");
      try {
        // Parse to validate it's proper JSON
        JSON.parse(cachedJobs);

        // Return validated cache data
        res.setHeader("Content-Type", "application/json");
        res.status(200);
        return res.end(cachedJobs);
      } catch (parseError) {
        console.error("Error parsing cached data:", parseError);
        // Fall through to DB query
      }
    }

    // 2. If not in cache or cache was invalid, fetch from MongoDB
    console.log("Cache miss for marketplace_jobs, fetching from DB");
    const jobs = await Job.find({ status: "open" }); // Fetch only open jobs

    // 3. Store the result in Redis with expiration
    const jobsJson = JSON.stringify(jobs);
    try {
      await setAsync(cacheKey, jobsJson, "EX", CACHE_EXPIRATION);
      console.log("Stored marketplace_jobs in cache");
    } catch (redisSetError) {
      console.error("Redis set error:", redisSetError);
    }

    // 4. Return the result from MongoDB
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.end(jobsJson);
  } catch (error) {
    console.error("Error fetching marketplace jobs:", error);
    // Generic error handling for database or other unexpected errors
    res.status(500);
    res.end(JSON.stringify({ error: "Error fetching jobs" }));
  }
};

// Get job by ID with Caching
const getJobById = async (req, res) => {
  const jobId = req.params.id;
  const cacheKey = `job:${jobId}`;

  try {
    const cachedJob = await getAsync(cacheKey);
    if (cachedJob) {
      console.log(`Cache hit for ${cacheKey}`);
      const job = JSON.parse(cachedJob);
      if (job === null) {
        return res.status(404).json({ error: "Job not found" });
      }
      return res.status(200).json(job);
    }

    console.log(`Cache miss for ${cacheKey}, fetching from DB`);
    const job = await Job.findById(jobId).populate("employer freelancer");

    if (!job) {
      try {
        await setAsync(cacheKey, JSON.stringify(null), "EX", CACHE_EXPIRATION);
        console.log(`Stored null for ${cacheKey} in cache`);
      } catch (redisSetError) {
        console.error("Redis set error:", redisSetError);
      }
      return res.status(404).json({ error: "Job not found" });
    }

    try {
      await setAsync(cacheKey, JSON.stringify(job), "EX", CACHE_EXPIRATION);
      console.log(`Stored ${cacheKey} in cache`);
    } catch (redisSetError) {
      console.error("Redis set error:", redisSetError);
    }

    res.status(200).json(job);
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);
    res.status(500).json({ error: "Error fetching job" });
  }
};

// Update job status
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    job.status = req.body.status || job.status;
    await job.save();
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: "Error updating job" });
  }
};

// Get filtered jobs with Caching (Key based on user role/ID)
const getFilteredJobs = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  // Simple key for now, could be more complex if filters were added
  const cacheKey = `filtered_jobs:${userRole}:${userId}`;

  try {
    const cachedFilteredJobs = await getAsync(cacheKey);
    if (cachedFilteredJobs) {
      console.log(`Cache hit for ${cacheKey}`);
      const jobs = JSON.parse(cachedFilteredJobs);
      return res.status(200).json({ jobs });
    }

    console.log(`Cache miss for ${cacheKey}, fetching from DB`);
    let filter = { status: "open" };

    if (userRole === "freelancer" || userRole === "hybrid") {
      filter.employer = { $ne: userId };
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    try {
      await setAsync(cacheKey, JSON.stringify(jobs), "EX", CACHE_EXPIRATION);
      console.log(`Stored ${cacheKey} in cache`);
    } catch (redisSetError) {
      console.error("Redis set error:", redisSetError);
    }

    res.status(200).json({ jobs });
  } catch (err) {
    console.error("Error retrieving filtered jobs:", err);
    res
      .status(500)
      .json({ message: "Error retrieving jobs", error: err.message });
  }
};

// Get a particular job by ID (Auth Check) with Caching
// Shares cache with getJobById as data is the same
const getJobByIdAuthCheck = async (req, res) => {
  const jobId = req.params.id;
  const cacheKey = `job:${jobId}`; // Reuse the same key as getJobById

  try {
    const cachedJob = await getAsync(cacheKey);
    if (cachedJob) {
      console.log(`Cache hit for ${cacheKey} (auth check)`);
      const job = JSON.parse(cachedJob);
      if (job === null) {
        return res.status(404).json({ message: "Job not found" });
      }
      return res.status(200).json({ job });
    }

    console.log(`Cache miss for ${cacheKey} (auth check), fetching from DB`);
    const job = await Job.findById(jobId).populate("employer freelancer");

    if (!job) {
      try {
        await setAsync(cacheKey, JSON.stringify(null), "EX", CACHE_EXPIRATION);
        console.log(`Stored null for ${cacheKey} in cache`);
      } catch (redisSetError) {
        console.error("Redis set error:", redisSetError);
      }
      return res.status(404).json({ message: "Job not found" });
    }

    try {
      await setAsync(cacheKey, JSON.stringify(job), "EX", CACHE_EXPIRATION);
      console.log(`Stored ${cacheKey} in cache`);
    } catch (redisSetError) {
      console.error("Redis set error:", redisSetError);
    }

    res.status(200).json({ job });
  } catch (err) {
    console.error(`Error retrieving job ${jobId} (auth check):`, err);
    res
      .status(500)
      .json({ message: "Error retrieving job", error: err.message });
  }
};

// Place a bid on a job
const createBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const { jobId } = req.params;
    const freelancerId = req.user.id;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ message: "Job is not open for bids" });
    }

    const newBid = new Bid({
      amount,
      job: jobId,
      freelancer: freelancerId,
    });

    await newBid.save();

    res.status(201).json({ message: "Bid placed successfully", bid: newBid });
  } catch (err) {
    res.status(500).json({ message: "Error placing bid", error: err.message });
  }
};

// Get all jobs posted by a specific user with Caching
const getJobsByUserId = async (req, res) => {
  const userId = req.params.userId;
  const cacheKey = `user_posted_jobs:${userId}`;

  try {
    const cachedUserJobs = await getAsync(cacheKey);
    if (cachedUserJobs) {
      console.log(`Cache hit for ${cacheKey}`);
      const jobs = JSON.parse(cachedUserJobs);
      return res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs,
      });
    }

    console.log(`Cache miss for ${cacheKey}, fetching from DB`);
    const jobs = await Job.find({ employer: userId })
      .populate("employer", "name username email")
      .populate("freelancer", "name username email")
      .sort({ createdAt: -1 });

    try {
      await setAsync(cacheKey, JSON.stringify(jobs), "EX", CACHE_EXPIRATION);
      console.log(`Stored ${cacheKey} in cache`);
    } catch (redisSetError) {
      console.error("Redis set error:", redisSetError);
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error(`Error fetching jobs for user ${userId}:`, error);
    res.status(500).json({
      success: false,
      message: "Error fetching user's jobs",
      error: error.message,
    });
  }
};

// Search jobs with Solr
const searchJobsSolr = async (req, res) => {
  try {
    const { query, status, categories, skills, minBudget, maxBudget, limit, page, sort } = req.query;
    
    // Build MongoDB query as fallback
    const mongoQuery = {};
    if (query && query !== '*:*') {
      mongoQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (status) mongoQuery.status = status;
    if (categories) {
      mongoQuery.categories = { 
        $in: Array.isArray(categories) ? categories : categories.split(',') 
      };
    }
    if (skills) {
      mongoQuery.skillsRequired = { 
        $in: Array.isArray(skills) ? skills : skills.split(',') 
      };
    }
    
    // Handle budget range
    if (minBudget || maxBudget) {
      mongoQuery.budget = {};
      if (minBudget) mongoQuery.budget.min = { $gte: parseInt(minBudget) };
      if (maxBudget) mongoQuery.budget.max = { $lte: parseInt(maxBudget) };
    }
    
    // Calculate pagination
    const start = page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 10) : 0;
    const pageSize = limit ? parseInt(limit) : 10;
    
    // Try Solr first
    try {
      // Build filters object for Solr
      const filters = {};
      if (status) filters.status = status;
      if (categories) {
        const categoriesArray = Array.isArray(categories) ? categories : categories.split(',');
        filters.categories = categoriesArray;
      }
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
        filters.skillsRequired = skillsArray;
      }
      if (minBudget) filters['budget_min:[' + parseInt(minBudget) + ' TO *]'] = '';
      if (maxBudget) filters['budget_max:[* TO ' + parseInt(maxBudget) + ']'] = '';
      
      const searchOptions = {
        start,
        limit: pageSize,
        filters,
        sort: sort || 'createdAt desc'
      };
      
      const result = await solrService.searchJobs(query || '*:*', searchOptions);
      
      return res.status(200).json({
        success: true,
        count: result.numFound,
        jobs: result.docs,
        source: 'solr'
      });
    } catch (solrError) {
      console.error('Solr search failed, falling back to MongoDB:', solrError);
      
      // Fallback to MongoDB
      let jobsQuery = Job.find(mongoQuery)
        .skip(start)
        .limit(pageSize);
      
      // Handle sorting
      if (sort) {
        const sortMapping = {
          'createdAt desc': { createdAt: -1 },
          'createdAt asc': { createdAt: 1 },
          'budget.max desc': { 'budget.max': -1 },
          'budget.min asc': { 'budget.min': 1 },
          '_version_ desc': { createdAt: -1 } // Map Solr version to createdAt
        };
        
        jobsQuery = jobsQuery.sort(sortMapping[sort] || { createdAt: -1 });
      } else {
        jobsQuery = jobsQuery.sort({ createdAt: -1 }); // Default sort
      }
      
      const jobs = await jobsQuery;
      const count = await Job.countDocuments(mongoQuery);
      
      return res.status(200).json({
        success: true,
        count,
        jobs,
        source: 'mongodb_fallback'
      });
    }
  } catch (error) {
    console.error('Error searching jobs:', error);
    
    // Last resort fallback - return empty results instead of error
    try {
      const jobs = await Job.find({})
        .sort({ createdAt: -1 })
        .limit(10);
      
      return res.status(200).json({
        success: true,
        count: jobs.length,
        jobs,
        source: 'mongodb_emergency_fallback',
        message: 'Search error occurred, showing recent jobs instead'
      });
    } catch (fallbackError) {
      // If even the fallback fails, return an error
      return res.status(500).json({
        success: false,
        message: 'Error searching jobs',
        error: error.message
      });
    }
  }
};

module.exports = {
  createJob,
  getMarketplaceJobs,
  getJobById,
  updateJob,
  getFilteredJobs,
  getJobByIdAuthCheck,
  createBid,
  getJobsByUserId,
  searchJobsSolr
};
