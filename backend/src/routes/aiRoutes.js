const router = require('express').Router();
const ctrl = require('../controllers/aiController');
const { validate } = require('../middleware/validate');

/**
 * @route   GET /api/v1/ai/explain/:planetName
 * @desc    AI-generated plain-language explanation of a planet
 * @param   planetName  {string} - Exact planet name
 * @query   audience    {string} - child | teen | adult (default: teen)
 */
router.get('/explain/:planetName', validate({ audience: 'audienceLevel' }), ctrl.explainPlanet);

/**
 * @route   GET /api/v1/ai/factcard/:planetName
 * @desc    3 AI-generated "Did you know?" facts about a planet
 * @param   planetName {string} - Exact planet name
 */
router.get('/factcard/:planetName', ctrl.generateFactCard);

module.exports = router;
