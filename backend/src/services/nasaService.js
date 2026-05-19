const { createHttpClient } = require('../config/httpClient');
const { NASA_API_KEY, NASA_APOD_BASE_URL, NASA_NEO_BASE_URL, NASA_IMAGES_BASE_URL } = require('../config/env');

const apodClient   = createHttpClient(NASA_APOD_BASE_URL);
const neoClient    = createHttpClient(NASA_NEO_BASE_URL);
const imagesClient = createHttpClient(NASA_IMAGES_BASE_URL);

// ─── APOD — Astronomy Picture of the Day ─────────────────────────────────────

/**
 * Get today's APOD or a specific date's entry.
 * @param {string|null} date - ISO date string YYYY-MM-DD (optional)
 */
const getApod = async (date = null) => {
  const params = { api_key: NASA_API_KEY };
  if (date) params.date = date;
  const { data } = await apodClient.get('', { params });
  return data;
};

/**
 * Get a random batch of APOD entries.
 * @param {number} count - Number of random entries (max 100)
 */
const getRandomApod = async (count = 5) => {
  const { data } = await apodClient.get('', {
    params: { api_key: NASA_API_KEY, count: Math.min(count, 100) },
  });
  return data;
};

// ─── NeoWs — Near Earth Objects ──────────────────────────────────────────────

/**
 * Get Near-Earth Objects passing by this week — great for context / wow factor.
 */
const getNearEarthObjects = async () => {
  const { data } = await neoClient.get('/feed/today', {
    params: { api_key: NASA_API_KEY },
  });
  // Flatten and simplify the response
  const allObjects = Object.values(data.near_earth_objects || {}).flat();
  return allObjects.map((obj) => ({
    id: obj.id,
    name: obj.name,
    diameter_km: obj.estimated_diameter?.kilometers,
    is_potentially_hazardous: obj.is_potentially_hazardous_asteroid,
    close_approach_date: obj.close_approach_data?.[0]?.close_approach_date,
    miss_distance_km: obj.close_approach_data?.[0]?.miss_distance?.kilometers,
    relative_velocity_kmh: obj.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour,
    nasa_url: obj.nasa_jpl_url,
  }));
};

// ─── NASA Image & Video Library ───────────────────────────────────────────────

/**
 * Search the NASA image library for space/exoplanet imagery.
 * @param {string} query - Search term
 * @param {number} pageSize
 */
const searchNasaImages = async (query = 'exoplanet', pageSize = 12) => {
  const { data } = await imagesClient.get('/search', {
    params: { q: query, media_type: 'image', page_size: pageSize },
  });
  const items = data?.collection?.items || [];
  return items.map((item) => ({
    title: item.data?.[0]?.title,
    description: item.data?.[0]?.description,
    date_created: item.data?.[0]?.date_created,
    nasa_id: item.data?.[0]?.nasa_id,
    center: item.data?.[0]?.center,
    thumbnail: item.links?.[0]?.href,
  }));
};

module.exports = {
  getApod,
  getRandomApod,
  getNearEarthObjects,
  searchNasaImages,
};
