const { z } = require('zod');

const updateSyllabusSchema = z.object({
  body: z.object({
    tracks: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      examDate: z.string().nullable().optional(),
      sections: z.array(z.object({
        title: z.string().min(1),
        topics: z.array(z.string())
      }))
    }))
  })
});

const addTrackSchema = z.object({
  body: z.object({
    id: z.string().min(1),
    label: z.string().min(1)
  })
});

const updateTrackSchema = z.object({
  body: z.object({
    label: z.string().min(1).optional(),
    examDate: z.string().nullable().optional(),
    sections: z.array(z.object({
      title: z.string().min(1),
      topics: z.array(z.string())
    })).optional()
  })
});

const addSectionSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    topics: z.array(z.string()).optional()
  })
});

module.exports = {
  updateSyllabusSchema,
  addTrackSchema,
  updateTrackSchema,
  addSectionSchema
};
