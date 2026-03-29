const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    count: {
      type: Number,
      default: 1, // Number of actions performed this day
    },
  },
  { timestamps: true }
);

// Compound index for querying a user's activity per day
ActivityLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
