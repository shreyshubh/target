const { z } = require('zod');

const createStudySessionSchema = z.object({
  body: z.object({
    subjectId: z.string().min(1, "Subject ID is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format YYYY-MM-DD"),
    durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute").max(1440, "Duration cannot exceed 24 hours"),
  })
});

module.exports = {
  createStudySessionSchema
};
