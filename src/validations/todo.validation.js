const { z } = require('zod');

const createTodoSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Text is required").max(500, "Text is too long"),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    dueDate: z.string().nullable().optional(),
    order: z.number().int().optional()
  })
});

const updateTodoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format")
  }),
  body: z.object({
    text: z.string().min(1).max(500).optional(),
    completed: z.boolean().optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    dueDate: z.string().nullable().optional(),
    order: z.number().int().optional()
  }).strict()
});

const bulkReorderSchema = z.object({
  body: z.object({
    updates: z.array(z.object({
      _id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
      order: z.number().int()
    })).min(1, "Items to update cannot be empty")
  })
});

module.exports = { createTodoSchema, updateTodoSchema, bulkReorderSchema };
