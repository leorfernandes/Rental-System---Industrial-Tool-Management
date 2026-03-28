const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const auth = require('../middleware/auth');

// @route   GET /api/analytics/summary
// @desc    Get counts for status and categories
// @access  Protected (Manager/Admin only ideally)
router.get('/summary', async (req, res) => {
    try {
        // 1. Get Status Distribution
        const statusDist = await Asset.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 2. Get Category Distribution
        const categoryDist = await Asset.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        // 3. Get Average Daily Rate
        const avgRate = await Asset.aggregate([
            { $group: { _id: null, average: { $avg: "$dailyRate" } } }
        ]);

        //4. Rate Distribution
        const rateDist = await Asset.aggregate([
            { $group: { _id: "$dailyRate", count: { $sum: 1 } } },
        ]);

        // 4. Get Raw Data for Scatter Plot & Detailed Tables
        // We only select the fields needed to keep the response lean
        const rawAssets = await Asset.find({}, 'name category dailyRate status');

        res.json({
            statusData: statusDist,
            categoryData: categoryDist,
            averageRate: avgRate[0]?.average || 0,
            rateData: rateDist,
            rawAssets: rawAssets // <--- This is what powers your scatter plot!
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;