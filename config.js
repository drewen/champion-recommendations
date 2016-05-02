// This file retrieves environment variables or provides defaults.
// Access via config.get('key')
// All config keys are overwritable by adding their values to the environment
// before starting the server.

const defaultConfigs = {
  SERVER_PORT: '3000',
  RIOT_API_KEY: '',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: '',
  POSTGRES_PASSWORD: '',
  POSTGRES_DB: 'test',
  BULK_REQUEST_DELAY: 3000
};

module.exports = {
  get(key) {
    return process.env[key] || defaultConfigs[key];
  }
}
