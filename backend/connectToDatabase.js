require('dotenv').config();
const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
      const {
        MONGO_USER = "",
        MONGO_PASS = "",
        MONGO_HOST,
        MONGO_DB
      } = process.env;
  
      // CI environment uses local MongoDB without authentication
      let mongoURI;
      if (process.env.CI) {
        mongoURI = `mongodb://${MONGO_HOST}/${MONGO_DB}`;
      } else {
        // Production/development uses MongoDB Atlas with authentication
        mongoURI = `mongodb+srv://${MONGO_USER}:${encodeURIComponent(MONGO_PASS)}@${MONGO_HOST}/${MONGO_DB}`;
      }
  
      await mongoose.connect(mongoURI);
  
      console.log("MongoDB connected");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      process.exit(1);  // terminates the program
    }
  }

module.exports = connectToDatabase;