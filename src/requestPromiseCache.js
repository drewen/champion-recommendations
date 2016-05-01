const rp = require('request-promise')
const moment = require('moment')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

function urlToCacheFilename(url, method) {
  const reformattedUrl = url.replace(/^https?:\/\//i, '')

  return `${reformattedUrl.replace(/\//g, '-')}_${method}.json`
}

const cache = {
    get: function (url, options) {
      return Promise.resolve().then(() => {
        const cacheUrl = urlToCacheFilename(url, options.method)
        // Cached files are stored as url_METHOD, with slashes replaced and no leading protocol
        // ie google.com-search_GET
        const cachedResponse = require(path.join(__dirname, `../.cache/${cacheUrl}`))

        // Only return the cached response if it has not yet expired
        if (moment.unix(cachedResponse.expires).isAfter(moment())) return cachedResponse
        throw new Error('')
      })
    },
    set: function (url, options, response) {
      const cacheUrl = urlToCacheFilename(url, options.method)
      console.log(`${cacheUrl} not found in cache, running request now...`)

      return response.then(data => {
        if (_.isArray(data)) {
          data = { data }
        }
        data.expires = moment().add(options.timeToLive || 30, 'minutes').unix();
        // const cacheUrl = urlToCacheFilename(url, options.method)
        fs.writeFileSync(path.join(__dirname, `../.cache/${cacheUrl}`), JSON.stringify(data), 'utf8')
        return data
      })
    }
};

module.exports = function rpWithCaching(url, options) {
  return cache.get(url, options)
    .catch(() => cache.set(url, options, rp(url, options)))
};
