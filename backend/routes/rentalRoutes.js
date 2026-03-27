const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Asset = require('../models/Asset');

const auth = require('../middleware/auth');

router.post('/', async (req, res) => {
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

    // 4. Update Asset Status to 'Rented'
    asset.status = 'Rented';
    await asset.save();
    
    const savedRental = await newRental.save();
    res.status(201).json(savedRental);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/rentals/:id/return
router.put('/:id/return', async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
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

// Shortcut to return a rental using only the Asset ID
router.put('/return-by-asset/:assetId', async (req, res) => {
    try {
        const rental = await Rental.findOne({ asset: req.params.assetId, status: 'Active' });
        if (!rental) return res.status(404).json({ message: "No active rental found for this asset" });

        rental.status = 'Completed';
        await rental.save();

        const asset = await Asset.findById(req.params.assetId);
        if (asset) {
            asset.status = 'Maintenance';
            await asset.save();
        }

        res.json({ message: "Returned successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;