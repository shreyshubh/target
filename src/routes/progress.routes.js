const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress.model');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateProgressSchema } = require('../validations/progress.validation');

// All routes are protected
router.use(authMiddleware);

// GET /api/progress
// Returns the progress object for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const doc = await Progress.findOne({ userId: req.user.id });
    if (!doc || !doc.progress) return res.json({});
    // Progress is a Mixed (plain object), return directly
    res.json(doc.progress);
  } catch (err) {
    next(err);
  }
});

// POST /api/progress
// Upserts the full progress for the authenticated user
router.post('/', validate(updateProgressSchema), async (req, res, next) => {
  try {
    const { progress } = req.body;

    let doc = await Progress.findOne({ userId: req.user.id });
    if (!doc) {
      doc = new Progress({ userId: req.user.id, progress: {} });
    }

    doc.progress = progress;
    doc.markModified('progress'); // Required for Mixed type
    await doc.save();

    res.json({ success: true, updatedAt: doc.updatedAt });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
