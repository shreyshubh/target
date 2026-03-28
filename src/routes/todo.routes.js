const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo.model');
const authMiddleware = require('../middleware/auth.middleware');

// All routes are protected
router.use(authMiddleware);

// Get all todos for the authenticated user
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ order: 1, createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a todo
router.post('/', async (req, res) => {
  try {
    const { text, dueDate, priority, order } = req.body;
    const newTodo = new Todo({ userId: req.user.id, text, dueDate, priority, order });
    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── IMPORTANT: /reorder/bulk MUST be before /:id ─────────────
// Reorder todos in bulk
router.put('/reorder/bulk', async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ error: "Updates must be an array" });
    
    await Promise.all(
      updates.map(u => Todo.findOneAndUpdate(
        { _id: u._id, userId: req.user.id },
        { order: u.order }
      ))
    );
    res.json({ message: 'Todos reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a todo (scoped to user) — whitelisted fields only
const ALLOWED_TODO_FIELDS = ['text', 'completed', 'dueDate', 'priority', 'order'];

router.put('/:id', async (req, res) => {
  try {
    // Whitelist fields to prevent injection of userId, _id, etc.
    const updates = {};
    for (const key of ALLOWED_TODO_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true }
    );
    if (!updatedTodo) return res.status(404).json({ error: 'Todo not found' });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a todo (scoped to user)
router.delete('/:id', async (req, res) => {
  try {
    const result = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ error: 'Todo not found' });
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
