const mongoose = require('mongoose');

const SyllabusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tracks: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        sections: [
          {
            title: { type: String, required: true },
            topics: [{ type: String }],
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// One syllabus per user
SyllabusSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Syllabus', SyllabusSchema);
