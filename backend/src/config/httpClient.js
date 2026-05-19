const axios = require('axios');

/**
 * Creates a configured Axios instance for NASA APIs.
 * Adds a response interceptor to normalize errors.
 */
const createHttpClient = (baseURL, timeout = 10000) => {
  const client = axios.create({ baseURL, timeout });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.MESSAGE ||
        error.response?.data?.message ||
        error.message ||
        'Unknown upstream error';
      const normalized = new Error(`Upstream API error (${status}): ${message}`);
      normalized.status = status;
      return Promise.reject(normalized);
    }
  );

  return client;
};

module.exports = { createHttpClient };
