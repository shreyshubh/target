const ActivityLog = require('../models/ActivityLog.model');

/**
 * Increments the user's activity count for today.
 * Extremely fast upsert that doesn't block the main request thread.
 */
async function logActivity(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await ActivityLog.findOneAndUpdate(
      { userId, date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    ).exec(); // Fire and forget
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

module.exports = logActivity;
