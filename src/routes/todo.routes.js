const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo.model');

// Get all todos
router.get('/', async (req, res) => {
  try {
    // Sort by order ascending, then fallback to newest first
    const todos = await Todo.find().sort({ order: 1, createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a todo
router.post('/', async (req, res) => {
  try {
    const { text, dueDate, priority, order } = req.body;
    const newTodo = new Todo({ text, dueDate, priority, order });
    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a todo (e.g., toggle completed)
router.put('/:id', async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder todos in bulk (for drag and drop)
router.put('/reorder/bulk', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { _id, order }
    if (!Array.isArray(updates)) return res.status(400).json({ error: "Updates must be an array" });
    
    // Process sequentially or using Promise.all
    await Promise.all(
      updates.map(u => Todo.findByIdAndUpdate(u._id, { order: u.order }))
    );
    res.json({ message: 'Todos reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
