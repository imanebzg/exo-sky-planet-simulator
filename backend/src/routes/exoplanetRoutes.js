const router = require('express').Router();
const ctrl = require('../controllers/exoplanetController');
const { validate } = require('../middleware/validate');

/**
 * @route   GET /api/v1/exoplanets
 * @desc    List exoplanets within a given distance
 * @query   maxDist {number} - Max distance in parsecs (default: 100)
 */
router.get('/', validate({ maxDist: 'positiveNumber' }), ctrl.getExoplanets);

/**
 * @route   GET /api/v1/exoplanets/search
 * @desc    Search exoplanets by partial name
 * @query   q {string} - Search term
 */
router.get('/search', ctrl.searchExoplanets);

/**
 * @route   GET /api/v1/exoplanets/habitable
 * @desc    Return potentially habitable exoplanet candidates
 */
router.get('/habitable', ctrl.getHabitableCandidates);

/**
 * @route   GET /api/v1/exoplanets/stats
 * @desc    Discovery statistics grouped by year and method
 */
router.get('/stats', ctrl.getDiscoveryStats);

/**
 * @route   GET /api/v1/exoplanets/:name
 * @desc    Get detailed data for a single planet
 * @param   name {string} - Exact planet name (e.g. "Kepler-22 b")
 */
router.get('/:name', ctrl.getPlanetByName);

module.exports = router;
