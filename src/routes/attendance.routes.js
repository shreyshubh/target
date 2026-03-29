const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance.model');
const AttendanceRecord = require('../models/AttendanceRecord.model');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateSubjectsSchema, updateTimetableSchema, updateRecordsSchema, bulkRecordsSchema, toggleHolidaySchema } = require('../validations/attendance.validation');

// All routes are protected
router.use(authMiddleware);

// Helper to get the user's base attendance document (create if needed)
const getAttendanceDoc = async (userId) => {
  let doc = await Attendance.findOne({ userId });
  if (!doc) {
    doc = new Attendance({
      userId,
      subjects: [],
      timetable: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
      holidays: [],
    });
    await doc.save();
  }
  return doc;
};

// GET full attendance data (assembled dynamically for legacy frontend compatibility)
router.get('/', async (req, res, next) => {
  try {
    const doc = await getAttendanceDoc(req.user.id);
    const recordsDocs = await AttendanceRecord.find({ userId: req.user.id });
    
    // Assmble into legacy format: { date: { subjectId: status } }
    const recordsMap = {};
    for (const r of recordsDocs) {
      if (!recordsMap[r.date]) recordsMap[r.date] = {};
      recordsMap[r.date][r.subjectId] = r.status;
    }

    res.json({
      _id: doc._id,
      userId: doc.userId,
      subjects: doc.subjects,
      timetable: doc.timetable,
      holidays: doc.holidays,
      records: recordsMap
    });
  } catch (error) {
    next(error);
  }
});

// POST to update subjects
router.post('/subjects', validate(updateSubjectsSchema), async (req, res, next) => {
  try {
    const { subjects } = req.body;
    const doc = await getAttendanceDoc(req.user.id);
    doc.subjects = subjects;
    await doc.save();
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

// POST to update timetable
router.post('/timetable', validate(updateTimetableSchema), async (req, res, next) => {
  try {
    const { timetable } = req.body;
    const doc = await getAttendanceDoc(req.user.id);
    doc.timetable = timetable;
    await doc.save();
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

// POST to mark/update daily attendance records (now saves to AttendanceRecord)
router.post('/records', validate(updateRecordsSchema), async (req, res, next) => {
  try {
    const { date, subjectId, status } = req.body;

    if (status === null || status === undefined) {
      await AttendanceRecord.findOneAndDelete({ userId: req.user.id, date, subjectId });
    } else {
      await AttendanceRecord.findOneAndUpdate(
        { userId: req.user.id, date, subjectId },
        { $set: { status } },
        { upsert: true }
      );
    }
    
    res.json({ success: true, message: 'Record updated' });
  } catch (error) {
    next(error);
  }
});

// POST to save entire records object directly (useful for bulk ops)
router.post('/records/bulk', validate(bulkRecordsSchema), async (req, res, next) => {
  try {
    const { records } = req.body; // format: { date: { subId: status } }
    
    // Convert to flat array
    const ops = [];
    for (const [date, subjectsMap] of Object.entries(records)) {
      for (const [subjectId, status] of Object.entries(subjectsMap)) {
        ops.push({
          updateOne: {
            filter: { userId: req.user.id, date, subjectId },
            update: { $set: { status } },
            upsert: true
          }
        });
      }
    }
    
    if (ops.length > 0) {
      await AttendanceRecord.bulkWrite(ops);
    }

    res.json({ success: true, message: 'Bulk write complete' });
  } catch (error) {
    next(error);
  }
});

// POST to toggle a holiday date
router.post('/holidays/toggle', validate(toggleHolidaySchema), async (req, res, next) => {
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
    next(error);
  }
});

module.exports = router;
