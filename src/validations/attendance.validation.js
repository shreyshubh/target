const { z } = require('zod');

const updateSubjectsSchema = z.object({
  body: z.object({
    subjects: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      totalClasses: z.number().int().min(0).default(0),
      attendedClasses: z.number().int().min(0).default(0)
    }))
  })
});

const updateTimetableSchema = z.object({
  body: z.object({
    timetable: z.object({
      0: z.array(z.string()),
      1: z.array(z.string()),
      2: z.array(z.string()),
      3: z.array(z.string()),
      4: z.array(z.string()),
      5: z.array(z.string()),
      6: z.array(z.string())
    }).strict()
  })
});

const updateRecordsSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format YYYY-MM-DD"),
    subjectId: z.string().min(1),
    status: z.enum(['present', 'absent', 'cancelled']).nullable()
  })
});

const bulkRecordsSchema = z.object({
  body: z.object({
    records: z.record(z.string(), z.record(z.string(), z.string()))
  })
});

const toggleHolidaySchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format YYYY-MM-DD")
  })
});

module.exports = {
  updateSubjectsSchema,
  updateTimetableSchema,
  updateRecordsSchema,
  bulkRecordsSchema,
  toggleHolidaySchema
};
