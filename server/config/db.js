const mongoose = require("mongoose");

const connectDB = async () => {
  const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/";
  const dbName = process.env.MONGODB_DBNAME || "skillhub";
  try {
    const conn = await mongoose.connect(`${dbURI}${dbName}`);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
