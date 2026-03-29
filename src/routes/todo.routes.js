const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo.model');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createTodoSchema, updateTodoSchema, bulkReorderSchema } = require('../validations/todo.validation');

// All routes are protected
router.use(authMiddleware);

// Get all todos for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ order: 1, createdAt: -1 });
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Create a todo
router.post('/', validate(createTodoSchema), async (req, res, next) => {
  try {
    const { text, dueDate, priority, order } = req.body;
    const newTodo = new Todo({ userId: req.user.id, text, dueDate, priority, order });
    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    next(error);
  }
});

// ── IMPORTANT: /reorder/bulk MUST be before /:id ─────────────
// Reorder todos in bulk
router.put('/reorder/bulk', validate(bulkReorderSchema), async (req, res, next) => {
  try {
    const { updates } = req.body;
    await Promise.all(
      updates.map(u => Todo.findOneAndUpdate(
        { _id: u._id, userId: req.user.id },
        { order: u.order }
      ))
    );
    res.json({ message: 'Todos reordered successfully' });
  } catch (error) {
    next(error);
  }
});

// Update a todo (scoped to user) — whitelisted fields via Zod
router.put('/:id', validate(updateTodoSchema), async (req, res, next) => {
  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body }, // req.body is already sanitized tightly by Zod `.strict()`
      { new: true, runValidators: true }
    );
    if (!updatedTodo) return res.status(404).json({ error: 'Todo not found' });
    res.json(updatedTodo);
  } catch (error) {
    next(error);
  }
});

// Delete a todo (scoped to user)
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ error: 'Todo not found' });
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
