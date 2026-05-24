const axios = require('axios');

/**
 * Creates a configured Axios instance for NASA APIs.
 */
const createHttpClient = (baseURL, timeout = 50000) => {
  const client = axios.create({
    baseURL,
    timeout,

    // Important
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  client.interceptors.response.use(
    (response) => response,

    (error) => {
      console.error('AXIOS ERROR:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      });

      const status = error.response?.status || 500;

      const message =
        error.response?.data?.MESSAGE ||
        error.response?.data?.message ||
        error.message ||
        'Unknown upstream error';

      const normalized = new Error(
        `Upstream API error (${status}): ${message}`
      );

      normalized.status = status;

      return Promise.reject(normalized);
    }
  );

  return client;
};

module.exports = { createHttpClient };