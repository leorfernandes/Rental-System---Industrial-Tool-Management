const mongoose = require('mongoose');
const User = require('./models/User');
const Renter = require('./models/Renter');
require('dotenv').config();
const connectToDatabase = require('./connectToDatabase');

const createAdminUser = async () => {
    try {
        // 1. Connect using your existing database    
        await connectToDatabase();
        
        // 2. Create admin user
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (!existingAdmin) {
            const admin = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        });
            await admin.save();
            console.log('Admin user created!');
        } else {
            console.log('Admin user already exists!');
        }
        
        // 3. Create staff user
        const existingStaff = await User.findOne({ email: 'staff@example.com' });
        if (!existingStaff) {
            const staff = new User({
                name: 'Staff User',
                email: 'staff@example.com',
                password: 'password123',
                role: 'staff'
            });
            await staff.save();
            console.log('Staff user created!');
        } else {
            console.log('Staff user already exists!');
        }

        // 4. Create renter user
        const existingRenter = await Renter.findOne({ email: 'test.renter@example.com' });
        if (!existingRenter) {
            const renter = new Renter({
            'firstName': 'Test',
            'lastName': 'Renter',
            'email': 'test.renter@example.com',
            'phone': '123-456-7890',
            'notes': 'Test renter account'
        });
            await renter.save();
            console.log('Renter user created!');
        } else {
            console.log('Renter user already exists!');
        }
        
        process.exit();
        
        } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

createAdminUser();