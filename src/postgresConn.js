const config = require('../config')
const knex = require('knex')

// Database settings to connect to Postgres for relation storing
function getConn() {
  console.log('CONNECTING TO DATABASE')
  const DATABASE_URL = config.get('DATABASE_URL')
  const connection = DATABASE_URL ||
    {
      charset: 'utf8',
      host : config.get('POSTGRES_HOST'),
      port : config.get('POSTGRES_PORT'),
      user : config.get('POSTGRES_USER'),
      password : config.get('POSTGRES_PASSWORD'),
      database : config.get('POSTGRES_DB'),
    }

  return knex({
    client: 'pg',
    connection,
    pool: {
      min: 0,
      max: 9
    }
  })
}


module.exports = getConn