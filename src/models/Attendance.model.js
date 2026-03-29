const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjects: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        totalClasses: { type: Number, default: 0 },
        attendedClasses: { type: Number, default: 0 },
      },
    ],
    // Map day of week (0=Sunday ... 6=Saturday) to array of subject IDs
    timetable: {
      0: [{ type: String }],
      1: [{ type: String }],
      2: [{ type: String }],
      3: [{ type: String }],
      4: [{ type: String }],
      5: [{ type: String }],
      6: [{ type: String }],
    },
    // Array of date strings marked as holidays
    holidays: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
