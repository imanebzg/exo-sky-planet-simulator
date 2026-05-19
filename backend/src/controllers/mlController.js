const mlService = require('../services/mlService');

/**
 * POST /api/v1/ml/classify
 * Body: { koi_period: 11.2, koi_prad: 1.07, koi_score: 0.9, ... }
 *
 * Classifies a set of transit parameters as CONFIRMED, CANDIDATE, or FALSE POSITIVE
 * using the Random Forest model trained on NASA's Kepler KOI dataset.
 */
exports.classifyCandidate = async (req, res, next) => {
  try {
    const features = req.body;
    if (!features || typeof features !== 'object' || Object.keys(features).length === 0) {
      return res.status(400).json({
        error: 'Request body must be a non-empty JSON object of KOI feature values.',
        hint: 'Call GET /api/v1/ml/features to see accepted parameters.',
      });
    }
    const result = await mlService.classifyCandidate(features);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ml/model
 * Returns model metadata: algorithm, dataset, feature importances.
 */
exports.getModelInfo = async (req, res, next) => {
  try {
    const info = await mlService.getModelInfo();
    res.json(info);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ml/features
 * Returns the list of accepted feature columns with descriptions.
 */
exports.getFeatureList = async (req, res, next) => {
  try {
    const features = await mlService.getFeatureList();
    res.json(features);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ml/health
 * Proxies the ML service health check.
 */
exports.getMLHealth = async (req, res, next) => {
  try {
    const health = await mlService.getMLHealth();
    res.json(health);
  } catch (err) {
    // Don't crash the main API if ML service is down — return a clear 503
    res.status(503).json({ error: 'ML service is not reachable.', detail: err.message });
  }
};
