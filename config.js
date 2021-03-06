// This file retrieves environment variables or provides defaults.
// Access via config.get('key')
// All config keys are overwritable by adding their values to the environment
// before starting the server.

const defaultConfigs = {
  PORT: '5000',
  RIOT_API_KEY: '',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: '',
  POSTGRES_PASSWORD: '',
  POSTGRES_DB: 'test',
  DATABASE_URL: '',
  BULK_REQUEST_DELAY: 5000,
  CACHE_TIME_TO_LIVE: 30,
  EVENTS_TIME_TO_LIVE: 30,
  NEIGHBOURHOOD_SEARCH_SIZE: 5000
};

module.exports = {
  get(key) {
    return process.env[key] || defaultConfigs[key];
  }
}
