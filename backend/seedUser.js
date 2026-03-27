const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
const connectToDatabase = require('./connectToDatabase');

const createAdminUser = async () => {
    try {
        // 1. Connect using your existing database    
        await connectToDatabase();
        
        // 2. Create admin user
        const admin = new User({
            username: 'admin',
            password: 'password123',
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created!');
        process.exit();
        
        } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

createAdminUser();