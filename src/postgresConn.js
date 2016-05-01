const config = require('../config')
const knex = require('knex')

// Database settings to connect to Postgres for relation storing
function getConn() {
  return knex({
    client: 'pg',
    connection: {
      charset: 'utf8',
      host : config.get('POSTGRES_HOST'),
      port : config.get('POSTGRES_PORT'),
      user : config.get('POSTGRES_USER'),
      password : config.get('POSTGRES_PASSWORD'),
      database : config.get('POSTGRES_DB'),
    }
  })
}


module.exports = getConn