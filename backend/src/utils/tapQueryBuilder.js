/**
 * Builds an ADQL SELECT query string for the NASA Exoplanet Archive TAP service.
 *
 * @param {Object} options
 * @param {string[]} options.columns - Columns to select
 * @param {string}   options.table   - Table name (e.g. 'ps')
 * @param {string}   [options.where] - WHERE clause (without the 'WHERE' keyword)
 * @param {string}   [options.order] - ORDER BY clause (without the 'ORDER BY' keyword)
 * @param {number}   [options.limit] - Max rows to return (optional)
 * @returns {string} Full ADQL query string
 */
const buildTapQuery = ({ columns, table, where, order, limit }) => {
  const cols = columns?.length ? columns.join(',') : '*';
  let query = `SELECT ${cols} FROM ${table}`;
  if (where) query += ` WHERE ${where}`;
  if (order) query += ` ORDER BY ${order}`;
  if (limit) query += ` TOP ${limit}`;
  return query;
};

module.exports = { buildTapQuery };
