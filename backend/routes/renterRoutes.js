const express = require('express');
const router = express.Router();
const Renter = require('../models/Renter');
const auth = require('../middleware/auth');

// @route   POST api/renters
// @desc    Register a new customer/renter
// @access  Private (Staff/Admin only)
router.post('/', auth, async (req, res) => {
    const { firstName, lastName, email, phone, notes } = req.body;

    try {
        // 1. Check if the renter already exists (Email must be unique)
        let renter = await Renter.findOne({ email });
        if (renter) {
            return res.status(400).json({ message: 'Renter with this email already exists' });
        }

        // 2. Create the new Renter instance
        renter = new Renter({
            firstName,
            lastName,
            email,
            phone,
            notes
        });

        // 3. Save to MongoDB
        await renter.save();
        res.status(201).json(renter);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during Renter creation');
    }
});

// @route   GET api/renters
// @desc    Get all registered renters (for the dropdown in the Rent Modal)
router.get('/', auth, async (req, res) => {
    try {
        const renters = await Renter.find().sort({ lastName: 1 });
        res.json(renters);
    } catch (err) {
        res.status(500).send('Server Error fetching renters');
    }
});

// @route   GET api/renters/:id
// @desc    Get a single renter by ID (for the Rent Modal details view)
router.get('/:id', auth, async (req, res) => { 
    try {
        const renter = await Renter.findById(req.params.id);
        
        if (!renter) {
            return res.status(404).json({ message: 'Renter not found' });
        }

        res.json(renter);
    } catch (err) {
        res.status(500).send('Server Error fetching renter details');
    }
});


// @route   DELETE api/renters/:id
// @desc    Delete a renter (Admin only ideally)
router.delete('/:id', auth, async (req, res) => {
    try {
        const renter = await Renter.findByIdAndDelete(req.params.id);
        
        if (!renter) {
            return res.status(404).json({ message: 'Renter not found' });
        }

        res.json({ message: 'Renter deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during Renter deletion');
    }  
});

// @route   PUT api/renters/:id
// @desc    Update renter details (Admin/Staff only)
router.put('/:id', auth, async (req, res) => {
  const { firstName, lastName, email, phone, notes } = req.body;
    try {
        let renter = await Renter.findById(req.params.id);

        if (!renter) {
            return res.status(404).json({ message: 'Renter not found' });
        }

        // If email is being updated, check for uniqueness
        if (email && email !== renter.email) {
            const emailExists = await Renter.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Renter with this email already exists' });
            }
        }

        // Update fields if they are provided
        if (firstName) renter.firstName = firstName;
        if (lastName) renter.lastName = lastName;
        if (email) renter.email = email;
        if (phone) renter.phone = phone;
        if (notes) renter.notes = notes;
        
        await renter.save();
        res.json(renter);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error updating renter');
    }
});

module.exports = router;