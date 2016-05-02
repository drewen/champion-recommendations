const _ = require('lodash')
const rp = require('request-promise')
const moment = require('moment')
const Promise = require('bluebird')
const postgresConn = require('./postgresConn')
const config = require('../config')

const cache = {

  // Initialize the caching table
  init: function(opts) {
    const pg = postgresConn()
    return pg.schema.createTableIfNotExists('champions.cache', table => {
      table.increments();
      table.string('url').notNullable()
      table.json('response').notNullable()
      table.timestamp('expires_at').notNullable()
    })
    // convert this into a promise
    .then(null)

  },
  // If something were to fail in a fetch, we want to invalidate that item's cache
  invalidate: function(url) {
    const pg = postgresConn()
    return pg('champions.cache')
    .where('url', url)
    .del()
    // convert this into a promise
    .then(null)
  },

  // Either it's already in the cache and not expired, or we need to do a full refresh
  get: function (url, opts) {
    const pg = postgresConn()
    return pg('champions.cache')
      .select('url', 'response', 'expires_at')
      .where('url', url)
      .orderBy('expires_at', 'desc')
      .limit(1)
    .then(rows => {
      pg.destroy()
      const cachedResponse = rows[0]
      cachedResponse.cached = true
      // Only return the cached response if it has not yet expired
      if (moment(cachedResponse.expires_at).isAfter(moment())) return cachedResponse.response
      throw new Error('')
    })
  },

  // Runs the request-promise call and caches the result
  set: function (url, opts, response) {
    console.log(`${url} not found in cache, running request now...`)

    return response.then(data => {
      if (_.isArray(data)) {
        data = { data }
      }
      const expires = moment().add(opts.timeToLive || 60, 'minutes').format();

      const pg = postgresConn()
      return pg('champions.cache').insert({ url, response: data, expires_at: expires })
      .then(() => {
        pg.destroy()
        return data
      })
    })
  }
};

module.exports = function rpWithCaching(url, opts) {
  if (opts.init) {
    return cache.init(opts)
  }
  if (opts.invalidate) {
    return cache.invalidate(url)
  }
  return cache.get(url, opts)
    .catch(() => cache.set(url, opts, rp(url, opts)))
    .catch(() => cache.invalidate(url)
      .then(() =>
        Promise.delay(config.get('BULK_REQUEST_DELAY'), cache.set(url, opts, rp(url, opts)))
      )
    )
};
