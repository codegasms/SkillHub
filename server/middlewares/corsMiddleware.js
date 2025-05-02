const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Default CORS options
const defaultCorsOptions = {
  origin: CLIENT_URL, // Default frontend URL
  credentials: true, // Allow credentials
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours
};

// Development CORS options (more permissive)
const developmentCorsOptions = {
  ...defaultCorsOptions,
  origin: true, // Allow all origins in development
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Production CORS options (more restrictive)
const productionCorsOptions = (allowedOrigins = [CLIENT_URL]) => ({
  ...defaultCorsOptions,
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
});

// Create CORS middleware based on environment
const createCorsMiddleware = (environment = "production", allowedOrigins) => {
  if (environment === "development") {
    return cors(developmentCorsOptions);
  }

  return cors(productionCorsOptions(allowedOrigins));
};

module.exports = {
  createCorsMiddleware,
  defaultCorsOptions,
  developmentCorsOptions,
  productionCorsOptions,
};
