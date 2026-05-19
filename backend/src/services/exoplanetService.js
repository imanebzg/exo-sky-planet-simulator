const { createHttpClient } = require('../config/httpClient');
const { NASA_EXOPLANET_BASE_URL } = require('../config/env');
const { buildTapQuery } = require('../utils/tapQueryBuilder');

const client = createHttpClient(NASA_EXOPLANET_BASE_URL);

/**
 * Base TAP query executor for the Exoplanet Archive.
 * @param {string} adql - Raw ADQL query string
 */
const runQuery = async (adql) => {
  const { data } = await client.get('', {
    params: { query: adql, format: 'json' },
  });
  return data;
};

// ─── Public Service Methods ───────────────────────────────────────────────────

/**
 * Fetch exoplanets within a given distance (parsecs) with positional + physical data.
 * @param {number} maxDistPc - Maximum distance in parsecs (default: 100)
 */
const getExoplanetsInRadius = async (maxDistPc = 100) => {
  const adql = buildTapQuery({
    columns: ['pl_name', 'hostname', 'ra', 'dec', 'sy_dist', 'pl_rade', 'pl_bmasse', 'pl_orbper', 'pl_eqt', 'disc_year', 'discoverymethod'],
    table: 'ps',
    where: `sy_dist<=${maxDistPc} AND pl_name IS NOT NULL`,
    order: 'sy_dist ASC',
  });
  return runQuery(adql);
};

/**
 * Get detailed data for a single planet by name.
 * @param {string} planetName
 */
const getPlanetByName = async (planetName) => {
  const adql = buildTapQuery({
    columns: [
      'pl_name', 'hostname', 'ra', 'dec', 'sy_dist',
      'pl_rade', 'pl_bmasse', 'pl_orbper', 'pl_eqt',
      'disc_year', 'discoverymethod', 'pl_orbsmax',
      'st_teff', 'st_rad', 'st_mass', 'sy_snum', 'sy_pnum',
    ],
    table: 'ps',
    where: `pl_name='${planetName.replace(/'/g, "''")}'`,
  });
  const results = await runQuery(adql);
  if (!results.length) throw Object.assign(new Error(`Planet "${planetName}" not found.`), { status: 404 });
  return results[0];
};

/**
 * Fetch potentially habitable exoplanets (equilibrium temp 200–320K, Earth-sized).
 */
const getHabitableCandidates = async () => {
  const adql = buildTapQuery({
    columns: ['pl_name', 'hostname', 'ra', 'dec', 'sy_dist', 'pl_rade', 'pl_bmasse', 'pl_eqt', 'disc_year'],
    table: 'ps',
    where: `pl_eqt BETWEEN 200 AND 320 AND pl_rade BETWEEN 0.5 AND 2.0`,
    order: 'pl_eqt ASC',
  });
  return runQuery(adql);
};

/**
 * Discovery statistics grouped by year and method.
 */
const getDiscoveryStats = async () => {
  const adql = `SELECT disc_year, discoverymethod, COUNT(*) as count FROM ps WHERE disc_year IS NOT NULL GROUP BY disc_year, discoverymethod ORDER BY disc_year ASC`;
  return runQuery(adql);
};

/**
 * Search planets by partial name.
 * @param {string} query
 */
const searchExoplanets = async (query) => {
  const safe = query.replace(/'/g, "''");
  const adql = buildTapQuery({
    columns: ['pl_name', 'hostname', 'ra', 'dec', 'sy_dist', 'disc_year', 'discoverymethod'],
    table: 'ps',
    where: `pl_name LIKE '%${safe}%'`,
    limit: 50,
  });
  return runQuery(adql);
};

module.exports = {
  getExoplanetsInRadius,
  getPlanetByName,
  getHabitableCandidates,
  getDiscoveryStats,
  searchExoplanets,
};
