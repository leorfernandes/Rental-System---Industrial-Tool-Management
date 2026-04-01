const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectToDatabase = require('./connectToDatabase');

const app = express();

// 1. MIDDLEWARE FIRST
app.use(cors());
app.use(express.json()); // Body parser MUST be here
app.use(express.static(path.join(__dirname, '../public')));

// 2. DEFINE ROUTES (Before listening)
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/rentals', require('./routes/rentalRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/renters', require('./routes/renterRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// 3. START SERVER (Single block)
const PORT = process.env.MY_PORT || 8888;

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
});

module.exports = app;