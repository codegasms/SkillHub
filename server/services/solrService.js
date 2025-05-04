const solr = require('solr-client');
const User = require('../models/user');
const Job = require('../models/job');

// Create clients for each core
const usersClient = solr.createClient({
  host: process.env.SOLR_HOST || 'localhost',
  port: process.env.SOLR_PORT || 8983,
  core: 'users_core',
  protocol: 'http'
});

const jobsClient = solr.createClient({
  host: process.env.SOLR_HOST || 'localhost',
  port: process.env.SOLR_PORT || 8983,
  core: 'jobs_core',
  protocol: 'http'
});

// Index a single user
const indexUser = async (user) => {
  try {
    const userDoc = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio || '',
      skills: user.info?.skills || []
    };
    
    await usersClient.add(userDoc);
    await usersClient.commit();
    return true;
  } catch (error) {
    console.error('Error indexing user to Solr:', error);
    return false;
  }
};

// Index a single job
const indexJob = async (job) => {
  try {
    const jobDoc = {
      id: job._id.toString(),
      title: job.title,
      description: job.description,
      employer: job.employer.toString(),
      status: job.status,
      categories: job.categories || [],
      skillsRequired: job.skillsRequired || [],
      budget_min: job.budget.min,
      budget_max: job.budget.max,
      created_at: new Date(job.createdAt).toISOString() // Add creation date
    };
    
    await jobsClient.add(jobDoc);
    await jobsClient.commit();
    return true;
  } catch (error) {
    console.error('Error indexing job to Solr:', error);
    return false;
  }
};

// Index all users
const indexAllUsers = async () => {
  try {
    const users = await User.find({});
    const docs = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio || '',
      skills: user.info?.skills || []
    }));
    
    if (docs.length > 0) {
      await usersClient.add(docs);
      await usersClient.commit();
    }
    return true;
  } catch (error) {
    console.error('Error indexing all users to Solr:', error);
    return false;
  }
};

// Index all jobs
const indexAllJobs = async () => {
  try {
    const jobs = await Job.find({});
    const docs = jobs.map(job => ({
      id: job._id.toString(),
      title: job.title,
      description: job.description,
      employer: job.employer.toString(),
      status: job.status,
      categories: job.categories || [],
      skillsRequired: job.skillsRequired || [],
      budget_min: job.budget.min,
      budget_max: job.budget.max
    }));
    
    if (docs.length > 0) {
      await jobsClient.add(docs);
      await jobsClient.commit();
    }
    return true;
  } catch (error) {
    console.error('Error indexing all jobs to Solr:', error);
    return false;
  }
};

// Search users
const searchUsers = async (query, options = {}) => {
  try {
    // Build query parameters directly
    let queryParams = {
      q: query? `(name:${query} OR username:${query} OR email:${query})`: '*:*',
      start: options.start || 0,
      rows: options.limit || 10
    };
    
    if (options.fields) {
      queryParams.fl = options.fields.join(',');
    }
    
    // Add filters
    if (options.filters) {
      let filterQueries = [];
      
      Object.entries(options.filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          // Handle array values (like skills)
          value.forEach(val => {
            filterQueries.push(`${field}:${val}`);
          });
        } else {
          filterQueries.push(`${field}:${value}`);
        }
      });
      
      if (filterQueries.length > 0) {
        queryParams.fq = filterQueries;
      }
    }
    
    console.log('Solr query params:', queryParams);
    
    const result = await usersClient.search(queryParams);
    return result.response;
  } catch (error) {
    console.error('Error searching users in Solr:', error);
    throw error;
  }
};

// Search jobs
const searchJobs = async (query, options = {}) => {
  try {
    // Check if Solr is available by pinging it
    try {
      await jobsClient.ping();
    } catch (pingError) {
      console.error('Solr ping failed:', pingError);
      throw new Error('Solr service unavailable');
    }
    
    // Build query parameters directly
    let queryParams = {
      q: '*:*', // Default to match all
      start: options.start || 0,
      rows: options.limit || 10
    };
    
    // If there's a specific query (not *:*), use it for title and description
    if (query && query !== '*:*') {
      queryParams.q = `title:${query} OR description:${query}`;
    }
    
    if (options.fields) {
      queryParams.fl = options.fields.join(',');
    }
    
    // Add filters
    if (options.filters) {
      let filterQueries = [];
      
      Object.entries(options.filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          // Handle array values (like skills)
          value.forEach(val => {
            filterQueries.push(`${field}:${val}`);
          });
        } else if (value && typeof value === 'string' && !field.includes('[')) {
          // Regular string filters
          filterQueries.push(`${field}:${value}`);
        } else if (field.includes('[')) {
          // Range queries are already formatted correctly
          filterQueries.push(field);
        }
      });
      
      if (filterQueries.length > 0) {
        queryParams.fq = filterQueries;
      }
    }
    
    // Add sort - make sure to use fields that exist in the schema
    if (options.sort) {
      // Map frontend sort fields to actual Solr fields
      const sortMapping = {
        'createdAt desc': '_version_ desc',
        'createdAt asc': '_version_ asc',
        'budget.max desc': 'budget_max desc',
        'budget.min asc': 'budget_min asc'
      };
      
      queryParams.sort = sortMapping[options.sort] || options.sort;
    }
    
    console.log('Solr query params:', queryParams);
    
    // Set a timeout for the Solr query
    const result = await Promise.race([
      jobsClient.search(queryParams),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Solr query timeout')), 5000)
      )
    ]);
    
    return result.response;
  } catch (error) {
    console.error('Error searching jobs in Solr:', error);
    throw error;
  }
};

module.exports = {
  indexUser,
  indexJob,
  indexAllUsers,
  indexAllJobs,
  searchUsers,
  searchJobs
};



