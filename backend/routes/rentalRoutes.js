const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Asset = require('../models/Asset');

const auth = require('../middleware/auth');

// @route   GET api/rentals
// @desc    Get all rentals (Admin/Staff only for overview)
router.get('/', auth, async (req, res) => {
    try {
        // Populate helps turn IDs into readable names for your analytics
        const rentals = await Rental.find()
            .populate('asset', 'name category') 
            .populate('renter', 'firstName lastName')
            .sort({ rentDate: -1 }); // Show newest first
        res.json(rentals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error fetching rental history');
    }
});

// @route   GET api/rentals/active
// @desc    Get only currently active rentals (Live Dashboard)
router.get('/active', auth, async (req, res) => {
    try {
        const activeRentals = await Rental.find({ status: 'Active' })
            .populate('asset', 'name')
            .populate('renter', 'firstName lastName');
        res.json(activeRentals);
    } catch (err) {
        res.status(500).send('Server Error fetching active rentals');
    }
});

// POST /api/rentals - Create a new rental
router.post('/', auth, async (req, res) => {
  try {
    // 1. Find the asset to get its price and current status
    const asset = await Asset.findById(req.body.asset);
    
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    if (asset.status !== 'Available') {
        return res.status(400).json({ message: "Asset is not available for rent" });
    }

    // 2. Calculate Total Cost (Simple version: Days * Rate)
    const rentDate = new Date();
    const returnDate = new Date(req.body.returnDate);
    const diffTime = Math.abs(returnDate - rentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day
    
    const totalCost = diffDays * asset.dailyRate;

    // 3. Create the Rental
    const newRental = new Rental({
      ...req.body,
      totalCost
    });
    
    // 4. Save the rental to MongoDB
    const savedRental = await newRental.save();

    // 5. Update Asset Status to 'Rented'
    asset.status = 'Rented';
    await asset.save();
    
    res.status(201).json(savedRental);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/rentals/return/:assetId
router.put('/return/:assetId', auth, async (req, res) => {
  try {
    const rental = await Rental.findOne({ asset: req.params.assetId, status: 'Active' });
    if (!rental) return res.status(404).json({ message: "Rental not found" });
    if (rental.status === 'Completed') {
      return res.status(400).json({ message: "Rental already returned" });
    }

    // 1. Update Rental Status
    rental.status = 'Completed';
    await rental.save();

    // 2. Update Asset Status to 'Maintenance'
    // We use the ID stored inside the rental object
    const asset = await Asset.findById(rental.asset);
    if (asset) {
      asset.status = 'Maintenance';
      await asset.save();
    }

    res.json(rental);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;