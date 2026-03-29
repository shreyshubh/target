const { z } = require('zod');

const updateProgressSchema = z.object({
  body: z.object({
    progress: z.record(z.string(), z.string().nullable())
  })
});

module.exports = {
  updateProgressSchema
};
