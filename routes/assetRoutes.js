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

module.exports = router;