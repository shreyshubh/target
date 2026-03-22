const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
    priority: { type: String, enum: ['High', 'Medium', 'Low', 'None'], default: 'None' },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Todo', TodoSchema);
