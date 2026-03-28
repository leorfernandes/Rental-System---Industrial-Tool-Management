const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const connectToDatabase = require('./connectToDatabase');

const path = require('path');
const app = express();
// Serve the 'public' folder as static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Rental System API is alive' });
});

// Connect to MongoDB
const PORT = process.env.MY_PORT || 8888;

// Start the server after connecting to the database
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);  // terminates the program
});

// Only listen if this file is run directly
if (require.main === module) {
  connectToDatabase().then(() => {
    app.listen(PORT, () => console.log(`Server on ${PORT}`));
  });
}

module.exports = app; // Export app for testing

// Routes
const assetRoutes = require('./routes/assetRoutes');
app.use('/api/assets', assetRoutes);

const rentalRoutes = require('./routes/rentalRoutes');
app.use('/api/rentals', rentalRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);