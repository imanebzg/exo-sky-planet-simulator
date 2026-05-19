const exoplanetService = require('../services/exoplanetService');

/**
 * GET /api/v1/exoplanets
 * Query: ?maxDist=100 (parsecs)
 */
exports.getExoplanets = async (req, res, next) => {
  try {
    const maxDist = Number(req.query.maxDist) || 100;
    const data = await exoplanetService.getExoplanetsInRadius(maxDist);
    res.json({ count: data.length, maxDist_pc: maxDist, results: data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/exoplanets/search
 * Query: ?q=Kepler
 */
exports.searchExoplanets = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing required query param: q' });
    const data = await exoplanetService.searchExoplanets(q);
    res.json({ count: data.length, query: q, results: data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/exoplanets/habitable
 */
exports.getHabitableCandidates = async (req, res, next) => {
  try {
    const data = await exoplanetService.getHabitableCandidates();
    res.json({ count: data.length, results: data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/exoplanets/stats
 */
exports.getDiscoveryStats = async (req, res, next) => {
  try {
    const data = await exoplanetService.getDiscoveryStats();
    res.json({ results: data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/exoplanets/:name
 */
exports.getPlanetByName = async (req, res, next) => {
  try {
    const planet = await exoplanetService.getPlanetByName(req.params.name);
    res.json(planet);
  } catch (err) {
    next(err);
  }
};
