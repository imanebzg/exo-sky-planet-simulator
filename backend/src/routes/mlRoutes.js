const router = require('express').Router();
const ctrl = require('../controllers/mlController');

/**
 * @route   GET /api/v1/ml/health
 * @desc    Check whether the ML microservice is running and the model is loaded
 */
router.get('/health', ctrl.getMLHealth);

/**
 * @route   GET /api/v1/ml/features
 * @desc    List all accepted feature columns with descriptions
 */
router.get('/features', ctrl.getFeatureList);

/**
 * @route   GET /api/v1/ml/model
 * @desc    Model metadata — algorithm, dataset, top feature importances
 */
router.get('/model', ctrl.getModelInfo);

/**
 * @route   POST /api/v1/ml/classify
 * @desc    Classify transit parameters as CONFIRMED | CANDIDATE | FALSE POSITIVE
 * @body    JSON object with any subset of the 14 KOI feature columns
 */
router.post('/classify', ctrl.classifyCandidate);

module.exports = router;
