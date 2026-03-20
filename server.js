const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Rental System API is alive' });
});

// Connect to MongoDB
const PORT = process.env.MY_PORT || 8888;
const MONGO_URI = process.env.MONGO_URI;

async function connectToDatabase() {
    try {
      const {
        MONGO_USER,
        MONGO_PASS,
        MONGO_HOST,
        MONGO_DB
      } = process.env;
  
      const mongoURI = `mongodb+srv://${MONGO_USER}:${encodeURIComponent(MONGO_PASS)}@${MONGO_HOST}/${MONGO_DB}`;
  
      await mongoose.connect(mongoURI);
  
      console.log("MongoDB connected");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      process.exit(1);  // terminates the program
    }
  }

// Start the server after connecting to the database
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);  // terminates the program
});

// Only listen if this file is run directly (not by a test)
if (require.main === module) {
  connectToDatabase().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
  });
}

module.exports = app; // Export app for testing

// Routes
const assetRoutes = require('./routes/assetRoutes');
app.use('/api/assets', assetRoutes);