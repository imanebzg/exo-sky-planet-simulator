const nasaService = require('../services/nasaService');

/**
 * GET /api/v1/nasa/apod
 * Query: ?date=YYYY-MM-DD (optional)
 */
exports.getApod = async (req, res, next) => {
  try {
    const data = await nasaService.getApod(req.query.date || null);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/nasa/apod/random
 * Query: ?count=5 (optional, max 100)
 */
exports.getRandomApod = async (req, res, next) => {
  try {
    const count = Number(req.query.count) || 5;
    const data = await nasaService.getRandomApod(count);
    res.json({ count: data.length, results: data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/nasa/neo
 * Near-Earth Objects passing by today
 */
exports.getNearEarthObjects = async (req, res, next) => {
  try {
    const data = await nasaService.getNearEarthObjects();
    res.json({ count: data.length, results: data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/nasa/images
 * Query: ?q=exoplanet&pageSize=12
 */
exports.searchNasaImages = async (req, res, next) => {
  try {
    const { q = 'exoplanet', pageSize = 12 } = req.query;
    const data = await nasaService.searchNasaImages(q, Number(pageSize));
    res.json({ count: data.length, query: q, results: data });
  } catch (err) {
    next(err);
  }
};
