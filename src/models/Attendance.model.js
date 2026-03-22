const mongoose = require('mongoose');

// We use a single document for the user since it's a personal app.
const AttendanceSchema = new mongoose.Schema(
  {
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
    // Map date string (e.g. "YYYY-MM-DD") to subject IDs attendance status
    // Example: { "2023-10-25": { "subj1": "present", "subj2": "absent" } }
    records: {
      type: Map,
      of: { type: Map, of: String },
      default: {},
    },
    // Array of date strings marked as holidays: ["YYYY-MM-DD"]
    holidays: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
