const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress.model');

// GET /api/progress/:userId
// Returns the progress map for a user (empty object if first visit)
router.get('/:userId', async (req, res) => {
  try {
    const doc = await Progress.findOne({ userId: req.params.userId });
    if (!doc) return res.json({});
    // Convert Map to plain object for JSON response
    res.json(Object.fromEntries(doc.progress));
  } catch (err) {
    console.error('GET progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/progress/:userId
// Body: { progress: { "dsa::Arrays & Strings::0": true, ... } }
// Upserts the full progress for the user
router.post('/:userId', async (req, res) => {
  try {
    const { progress } = req.body;
    if (!progress || typeof progress !== 'object') {
      return res.status(400).json({ error: 'Invalid progress payload' });
    }
    const doc = await Progress.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: { progress } },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
    res.json({ success: true, updatedAt: doc.updatedAt });
  } catch (err) {
    console.error('POST progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
