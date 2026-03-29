const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true, // Speeds up queries by date
    },
    subjectId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'cancelled'],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user only has one specific record for a subject on a given date
AttendanceRecordSchema.index({ userId: 1, date: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);
