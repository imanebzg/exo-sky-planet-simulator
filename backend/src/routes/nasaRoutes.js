const router = require('express').Router();
const ctrl = require('../controllers/nasaController');

/**
 * @route   GET /api/v1/nasa/apod
 * @desc    Astronomy Picture of the Day
 * @query   date {string} - Optional ISO date (YYYY-MM-DD)
 */
router.get('/apod', ctrl.getApod);

/**
 * @route   GET /api/v1/nasa/apod/random
 * @desc    Random APOD entries
 * @query   count {number} - How many (default: 5, max: 100)
 */
router.get('/apod/random', ctrl.getRandomApod);

/**
 * @route   GET /api/v1/nasa/neo
 * @desc    Near-Earth Objects passing by today
 */
router.get('/neo', ctrl.getNearEarthObjects);

/**
 * @route   GET /api/v1/nasa/images
 * @desc    Search the NASA Image & Video Library
 * @query   q {string}        - Search query (default: "exoplanet")
 * @query   pageSize {number} - Results per page (default: 12)
 */
router.get('/images', ctrl.searchNasaImages);

module.exports = router;
