const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');

const auth = require('../middleware/auth');

// @route   POST /api/assets
// @desc    Add a new industrial tool
router.post('/', auth, async (req, res) => {
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
router.get('/', auth,  async (req, res) => {
  try {
    const assets = await Asset.find();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single asset by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/assets/clear-maintenance/:id
router.put('/clear-maintenance/:id', auth, async (req, res) => {
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

// PUT /api/assets/:id - Update asset details (for editing)
router.put('/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/assets/:id - Remove an asset from inventory
router.delete('/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (asset.status === 'Rented') {
        return res.status(400).json({ message: "Cannot delete an asset that is currently rented." });
    }
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ message: "Asset deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;