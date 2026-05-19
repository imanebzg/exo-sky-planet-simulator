const aiService = require('../services/aiService');
const exoplanetService = require('../services/exoplanetService');

/**
 * GET /api/v1/ai/explain/:planetName
 * Query: ?audience=teen (child | teen | adult)
 *
 * Fetches planet data from NASA then generates an AI explanation.
 */
exports.explainPlanet = async (req, res, next) => {
  try {
    const { planetName } = req.params;
    const audienceLevel = req.query.audience || 'teen';

    // First, get the raw planet data from NASA
    const planetData = await exoplanetService.getPlanetByName(planetName);

    // Then generate an AI explanation
    const result = await aiService.explainPlanet(planetData, audienceLevel);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ai/factcard/:planetName
 *
 * Generates 3 AI-powered "Did you know?" facts for a planet.
 */
exports.generateFactCard = async (req, res, next) => {
  try {
    const { planetName } = req.params;
    const planetData = await exoplanetService.getPlanetByName(planetName);
    const result = await aiService.generateFactCard(planetName, planetData);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
