const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
const connectToDatabase = require('./connectToDatabase');

const createAdminUser = async () => {
    try {
        // 1. Connect using your existing database    
        await connectToDatabase();
        
        // 2. Create admin user
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (!existingAdmin) {
            const admin = new User({
            username: 'admin',
            password: 'password123',
            role: 'admin'
        });
            await admin.save();
        } else {
            console.log('Admin user already exists!');
        }
        
        const existingStaff = await User.findOne({ username: 'staff' });
        if (!existingStaff) {
            const staff = new User({
                username: 'staff',
                password: 'password123',
                role: 'staff'
            });
            await staff.save();
        } else {
            console.log('Staff user already exists!');
        }
        
        process.exit();
        
        } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

createAdminUser();