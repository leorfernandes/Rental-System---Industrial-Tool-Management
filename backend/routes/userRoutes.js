const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');


// @route   GET api/users
// @desc    Get all staff members (Admin only)
router.get('/', async (req, res) => {
    try {
        // Double-check role for extra security
        const users = await User.find().select('-password').sort({ name: 1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/:email', async (req, res) => {
    try {
        // Double-check role for extra security
        const user = await User.findOne({ email: req.params.email }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/users
// @desc    Register a new staff member
router.post('/', async (req, res) => {
    console.log("Content-Type Header:", req.headers['content-type']);
    console.log("Body received:", req.body);
    const { name, email, password, role } = req.body;

    try {
        // 2. Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 3. Create instance
        user = new User({ name, email, password, role });

        // 4. Hash Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Return the user without the password
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json(userResponse);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;