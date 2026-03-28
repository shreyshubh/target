const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress.model');
const authMiddleware = require('../middleware/auth.middleware');

// All routes are protected
router.use(authMiddleware);

// GET /api/progress
// Returns the progress object for the authenticated user
router.get('/', async (req, res) => {
  try {
    const doc = await Progress.findOne({ userId: req.user.id });
    if (!doc || !doc.progress) return res.json({});
    // Progress is a Mixed (plain object), return directly
    res.json(doc.progress);
  } catch (err) {
    console.error('GET progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/progress
// Upserts the full progress for the authenticated user
router.post('/', async (req, res) => {
  try {
    const { progress } = req.body;
    if (!progress || typeof progress !== 'object') {
      return res.status(400).json({ error: 'Invalid progress payload' });
    }

    let doc = await Progress.findOne({ userId: req.user.id });
    if (!doc) {
      doc = new Progress({ userId: req.user.id, progress: {} });
    }

    doc.progress = progress;
    doc.markModified('progress'); // Required for Mixed type
    await doc.save();

    res.json({ success: true, updatedAt: doc.updatedAt });
  } catch (err) {
    console.error('POST progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
