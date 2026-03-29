const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog.model');
const authMiddleware = require('../middleware/auth.middleware');

// All routes are protected
router.use(authMiddleware);

// GET /api/analytics/activity
// Returns the user's activity log for constructing the Heatmap
router.get('/activity', async (req, res, next) => {
  try {
    // Only return the last 365 days of activity for performance
    const oneYearAgoStr = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
    
    const logs = await ActivityLog.find({ 
      userId: req.user.id,
      date: { $gte: oneYearAgoStr }
    }).select('date count -_id');
    
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
