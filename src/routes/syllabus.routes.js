const express = require('express');
const router = express.Router();
const Syllabus = require('../models/Syllabus.model');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateSyllabusSchema, addTrackSchema, updateTrackSchema, addSectionSchema } = require('../validations/syllabus.validation');

// All routes are protected
router.use(authMiddleware);

// GET /api/syllabus — fetch user's syllabus
router.get('/', async (req, res, next) => {
  try {
    const doc = await Syllabus.findOne({ userId: req.user.id });
    if (!doc) return res.json({ tracks: [] });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/syllabus — save/replace entire syllabus
router.post('/', validate(updateSyllabusSchema), async (req, res, next) => {
  try {
    const { tracks } = req.body;

    const doc = await Syllabus.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { tracks } },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    // Clean up orphaned progress keys
    try {
      const Progress = require('../models/Progress.model');
      const progressDoc = await Progress.findOne({ userId: req.user.id });
      if (progressDoc && progressDoc.progress) {
        // Build set of valid keys from new tracks
        const validKeys = new Set();
        (tracks || []).forEach((track) => {
          (track.sections || []).forEach((section) => {
            (section.topics || []).forEach((topic) => {
              validKeys.add(`${track.id}::${section.title}::${topic}`);
            });
          });
        });
        // Remove keys that no longer exist
        let cleaned = false;
        for (const key of Object.keys(progressDoc.progress)) {
          if (!validKeys.has(key)) {
            delete progressDoc.progress[key];
            cleaned = true;
          }
        }
        if (cleaned) {
          progressDoc.markModified('progress');
          await progressDoc.save();
        }
      }
    } catch (cleanupErr) {
      console.error('Progress cleanup warning:', cleanupErr.message);
      // Non-critical, don't fail the response
    }

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/syllabus/track — add a new track (subject)
router.post('/track', validate(addTrackSchema), async (req, res, next) => {
  try {
    const { id, label } = req.body;

    let doc = await Syllabus.findOne({ userId: req.user.id });
    if (!doc) {
      doc = new Syllabus({ userId: req.user.id, tracks: [] });
    }

    // Check for duplicate track id
    if (doc.tracks.some(t => t.id === id)) {
      return res.status(409).json({ error: 'A subject with this ID already exists.' });
    }

    doc.tracks.push({ id, label, sections: [] });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// PUT /api/syllabus/track/:trackId — update a track
router.put('/track/:trackId', validate(updateTrackSchema), async (req, res, next) => {
  try {
    const { label, sections, examDate } = req.body;
    const doc = await Syllabus.findOne({ userId: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Syllabus not found.' });

    const track = doc.tracks.find(t => t.id === req.params.trackId);
    if (!track) return res.status(404).json({ error: 'Track not found.' });

    if (label !== undefined) track.label = label;
    if (sections !== undefined) track.sections = sections;
    if (examDate !== undefined) track.examDate = examDate;
    
    
    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/syllabus/track/:trackId — delete a track
router.delete('/track/:trackId', async (req, res, next) => {
  try {
    const doc = await Syllabus.findOne({ userId: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Syllabus not found.' });

    doc.tracks = doc.tracks.filter(t => t.id !== req.params.trackId);
    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/syllabus/track/:trackId/section — add a section to a track
router.post('/track/:trackId/section', validate(addSectionSchema), async (req, res, next) => {
  try {
    const { title, topics } = req.body;

    const doc = await Syllabus.findOne({ userId: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Syllabus not found.' });

    const track = doc.tracks.find(t => t.id === req.params.trackId);
    if (!track) return res.status(404).json({ error: 'Track not found.' });

    track.sections.push({ title, topics: topics || [] });
    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
