const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Write back parsed data which strips unknown fields
    req.body = result.body;
    req.query = result.query;
    req.params = result.params;
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({ error: messages.join(', ') });
    }
    next(error);
  }
};

module.exports = validate;
