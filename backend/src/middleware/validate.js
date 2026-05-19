/**
 * Validates that query parameters match expected types/ranges.
 * Usage: validate({ dist: 'positiveNumber', name: 'string' })
 */
const validate = (schema) => (req, res, next) => {
  for (const [key, type] of Object.entries(schema)) {
    const value = req.query[key] ?? req.params[key];
    if (value === undefined) continue; // Optional params

    if (type === 'positiveNumber') {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return res.status(400).json({ error: `Query param '${key}' must be a positive number.` });
      }
    }

    if (type === 'string' && typeof value !== 'string') {
      return res.status(400).json({ error: `Query param '${key}' must be a string.` });
    }

    if (type === 'audienceLevel' && !['child', 'teen', 'adult'].includes(value)) {
      return res.status(400).json({ error: `'${key}' must be one of: child, teen, adult.` });
    }
  }
  next();
};

module.exports = { validate };
