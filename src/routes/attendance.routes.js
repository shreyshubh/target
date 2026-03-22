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
    // Expected generic body shape: { date: "YYYY-MM-DD", subjectId: "sub1", status: "present"|"absent" }
    const { date, subjectId, status } = req.body;
    const doc = await getAttendanceDoc();

    if (!doc.records) {
      doc.records = new Map();
    }
    
    // Convert to js object to modify easily or use Map api
    const recordsObj = Object.fromEntries(doc.records);
    if (!recordsObj[date]) {
      recordsObj[date] = {};
    }
    
    recordsObj[date][subjectId] = status;
    
    doc.records = recordsObj;
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

module.exports = router;
