// This file retrieves environment variables or provides defaults. Access via config.get('key')

const defaultConfigs = {
  SERVER_PORT: '3000',
  REDIS_PORT: '6379',
  REDIS_URL: '127.0.0.1',
  REDIS_AUTH: '',
  RIOT_API_KEY: '',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: '',
  POSTGRES_PASSWORD: '',
  POSTGRES_DB: 'test',
  MAX_CHUNK_SIZE: 10,
  REQUEST_DELAY: 3000
};

module.exports = {
  get(key) {
    return process.env[key] || defaultConfigs[key];
  }
}
