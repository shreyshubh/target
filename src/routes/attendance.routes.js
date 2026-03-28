const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance.model');
const authMiddleware = require('../middleware/auth.middleware');

// All routes are protected
router.use(authMiddleware);

// Helper to get the user's attendance document (create if needed)
const getAttendanceDoc = async (userId) => {
  let doc = await Attendance.findOne({ userId });
  if (!doc) {
    doc = new Attendance({
      userId,
      subjects: [],
      timetable: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
      records: {},
    });
    await doc.save();
  }
  return doc;
};

// GET full attendance data
router.get('/', async (req, res) => {
  try {
    const doc = await getAttendanceDoc(req.user.id);
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to update subjects
router.post('/subjects', async (req, res) => {
  try {
    const { subjects } = req.body;
    const doc = await getAttendanceDoc(req.user.id);
    doc.subjects = subjects;
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to update timetable
router.post('/timetable', async (req, res) => {
  try {
    const { timetable } = req.body;
    const doc = await getAttendanceDoc(req.user.id);
    doc.timetable = timetable;
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to mark/update daily attendance records
router.post('/records', async (req, res) => {
  try {
    const { date, subjectId, status } = req.body;
    const doc = await getAttendanceDoc(req.user.id);

    if (!doc.records) {
      doc.records = new Map();
    }
    
    if (!doc.records.has(date)) {
      doc.records.set(date, new Map());
    }
    
    const dayRecordMap = doc.records.get(date);
    
    if (status === null || status === undefined) {
      dayRecordMap.delete(subjectId);
    } else {
      dayRecordMap.set(subjectId, status);
    }
    
    doc.markModified('records');
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to save entire records object directly
router.post('/records/bulk', async (req, res) => {
  try {
    const { records } = req.body;
    if (!records || typeof records !== 'object') {
      return res.status(400).json({ error: 'Records object is required.' });
    }
    const doc = await getAttendanceDoc(req.user.id);
    doc.records = records;
    doc.markModified('records');
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to toggle a holiday date
router.post('/holidays/toggle', async (req, res) => {
  try {
    const { date } = req.body;
    const doc = await getAttendanceDoc(req.user.id);
    
    if (!doc.holidays) doc.holidays = [];
    
    const index = doc.holidays.indexOf(date);
    if (index > -1) {
      doc.holidays.splice(index, 1);
    } else {
      doc.holidays.push(date);
    }
    
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
