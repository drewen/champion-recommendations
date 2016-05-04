const config = require('../config')
const riotApi = require('./riotApi')
const moment = require('moment')
const postgresConn = require('./postgresConn')
const Promise = require('bluebird')

function populate (app, players) {
  const region = players.region
  return Promise.map(players.entries, player => {
    return riotApi.getSummonerDataById(player.playerOrTeamId, region)
      .then(summonerData => {
        return setRelations(app, summonerData)
        .then(() => {
          return Promise.delay(config.get('BULK_REQUEST_DELAY'), Promise.resolve(true))
        })
      })
      .catch(err => {
        console.log(err.message)
        return Promise.delay(config.get('BULK_REQUEST_DELAY'), Promise.resolve(true))
      })
    }, {concurrency: 1})
}

// Recursively and randomly add challenger players to our baseline
function fetchChallenger(app) {
  return riotApi.getRandomChallengerData().then(players => {
    return populate(app, players)
  })
  .then(() => {
    return fetchChallenger(app)
  })
}

// Fetch static champion data on boot, then once per hour after that
function fetchChampions(app) {
  return riotApi.getAllRegionChampions()
    .then(champions => {
      app.champions = champions
      setTimeout(fetchChampions, 60 * 1000 * 60)
    })
}

// Periodically remove expired data from cache and events
function clearExpiredData() {
  return Promise.delay(3 * 1000 * 60, () => {
    const pg = postgresConn()
    console.log('Removing expired rows...')
    return Promise.all([
      pg('champions.cache')
        .where('expires_at', '<=', moment().format())
        .del()
        // convert this into a promise
        .then(rowsAffected => {
          return rowsAffected
        }),
      pg('champions.events')
        .where('expires_at', '<=', moment().format())
        .del()
        // convert this into a promise
        .then(rowsAffected => {
          return rowsAffected
        })
      ]).then((rowsAffected) => {
        console.log(`Removed ${rowsAffected[0] + rowsAffected[1]} expired rows.`)
        pg.destroy()
        return clearExpiredData()
      })
  })
}


// Add different champion/game data to the recommendation engine
function setRelations(app, summonerData) {
  const setRelationForPlayer = app.recommendationEngine.setRelation.bind(app.recommendationEngine, summonerData.id)
  console.log(`Clearing old relations from Event Store for ${summonerData.name}...`)
  return app.recommendationEngine.clearRelations(summonerData.id)
    .then(() => {
      console.log(`Setting champion masteries relations for ${summonerData.name}...`)
      return Promise.map(summonerData.champions, champion => {
        return setRelationForPlayer(`rank${champion.championLevel}`, champion.championId)
      })
    })
    .then(() => {
      console.log(`Setting champion gameplay relations for ${summonerData.name}...`)
      return Promise.map(summonerData.games, game => {
        const champion = app.champions[summonerData.region].data[game.championId]
        return setRelationForPlayer(game.stats.win ? 'win' : 'loss', champion.championId)
      })
    })
}

module.exports = {
  clearExpiredData,
  fetchChallenger,
  fetchChampions,
  setRelations
}