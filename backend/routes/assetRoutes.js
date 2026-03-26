const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');

// @route   POST /api/assets
// @desc    Add a new industrial tool
router.post('/', async (req, res) => {
  try {
    const newAsset = new Asset(req.body);
    const savedAsset = await newAsset.save();
    res.status(201).json(savedAsset);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   GET /api/assets
// @desc    Get all tools (Inventory list)
router.get('/', async (req, res) => {
  try {
    const assets = await Asset.find();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single asset by ID
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/assets/:id/clear-maintenance
router.put('/:id/clear-maintenance', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    if (asset.status !== 'Maintenance') {
      return res.status(400).json({ message: "Asset is not in maintenance" });
    }

    asset.status = 'Available';
    asset.lastInspection = new Date(); // Reset the inspection clock
    await asset.save();

    res.json({ message: "Asset cleared and is now Available", asset });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;