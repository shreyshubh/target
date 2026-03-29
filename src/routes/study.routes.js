const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession.model');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createStudySessionSchema } = require('../validations/study.validation');

// All routes are protected
router.use(authMiddleware);

// GET /api/study/stats - Get study duration aggregated by subject
router.get('/stats', async (req, res, next) => {
  try {
    const sessions = await StudySession.find({ userId: req.user.id });
    
    // Aggregate minutes by subjectId
    const aggregated = sessions.reduce((acc, sess) => {
      acc[sess.subjectId] = (acc[sess.subjectId] || 0) + sess.durationMinutes;
      return acc;
    }, {});
    
    res.json(aggregated);
  } catch (error) {
    next(error);
  }
});

// POST /api/study - Record a new completed Pomodoro session
router.post('/', validate(createStudySessionSchema), async (req, res, next) => {
  try {
    const { subjectId, date, durationMinutes } = req.body;
    
    const doc = new StudySession({
      userId: req.user.id,
      subjectId,
      date,
      durationMinutes
    });
    
    await doc.save();
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
