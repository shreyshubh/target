const { z } = require('zod');

const updateProgressSchema = z.object({
  body: z.object({
    progress: z.record(z.string(), z.boolean())
  })
});

module.exports = {
  updateProgressSchema
};
