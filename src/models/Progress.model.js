const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Keys like "dsa::Foundations::Big-O, Theta, Omega notation" => true/false
    // Using Mixed instead of Map because topic names contain special chars
    // that cause Mongoose Map validation to fail
    progress: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
