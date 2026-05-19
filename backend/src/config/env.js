require('dotenv').config();

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_VERSION: process.env.API_VERSION || 'v1',
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',

  // NASA APIs
  NASA_API_KEY: process.env.NASA_API_KEY || 'DEMO_KEY', // Get yours at https://api.nasa.gov/
  NASA_EXOPLANET_BASE_URL: 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync',
  NASA_APOD_BASE_URL: 'https://api.nasa.gov/planetary/apod',
  NASA_NEO_BASE_URL: 'https://api.nasa.gov/neo/rest/v1',
  NASA_IMAGES_BASE_URL: 'https://images-api.nasa.gov',

  // AI (optional — uses Claude via Anthropic API)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || null,
};
