const { createHttpClient } = require('../config/httpClient');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const client = createHttpClient(ML_BASE_URL, 15000); // longer timeout — model may be warming up

/**
 * Classify a KOI candidate using the local ML microservice.
 * Accepts any subset of the 14 KOI feature columns.
 * Missing values are median-imputed by the Python service.
 *
 * @param {Object} features - Key/value pairs from FEATURE_COLS
 */
const classifyCandidate = async (features) => {
  const { data } = await client.post('/predict', features);
  return data;
};

/**
 * Return model metadata: algorithm, dataset, top feature importances.
 */
const getModelInfo = async () => {
  const { data } = await client.get('/model/info');
  return data;
};

/**
 * Return the list of accepted feature columns with descriptions.
 */
const getFeatureList = async () => {
  const { data } = await client.get('/features');
  return data;
};

/**
 * Check whether the ML service is running and the model is loaded.
 */
const getMLHealth = async () => {
  const { data } = await client.get('/health');
  return data;
};

module.exports = { classifyCandidate, getModelInfo, getFeatureList, getMLHealth };
