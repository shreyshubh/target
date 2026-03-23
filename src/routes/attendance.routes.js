const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance.model');

// Default helper to get the single attendance document
const getAttendanceDoc = async () => {
  let doc = await Attendance.findOne();
  if (!doc) {
    doc = new Attendance({
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
    const doc = await getAttendanceDoc();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to update subjects
router.post('/subjects', async (req, res) => {
  try {
    const { subjects } = req.body; // Expects an array of subjects
    const doc = await getAttendanceDoc();
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
    const doc = await getAttendanceDoc();
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
    const doc = await getAttendanceDoc();

    if (!doc.records) {
      doc.records = new Map();
    }
    
    // Correct way to write to a Map of Maps in Mongoose
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

// POST to save entire records object directly (useful for bulk updates)
router.post('/records/bulk', async (req, res) => {
  try {
    const { records } = req.body;
    const doc = await getAttendanceDoc();
    doc.records = records;
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
    const doc = await getAttendanceDoc();
    
    // Ensure holidays array exists
    if (!doc.holidays) doc.holidays = [];
    
    const index = doc.holidays.indexOf(date);
    if (index > -1) {
      // Remove it if it exists
      doc.holidays.splice(index, 1);
    } else {
      // Add it if it doesn't
      doc.holidays.push(date);
    }
    
    // Note for mongoose array modifications we generally need save()
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
