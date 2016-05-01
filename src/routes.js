const _ = require('lodash')

const riotApi = require('./riotApi')
const config = require('../config')
const Promise = require('bluebird')

function getChampionDataByIdAndRegion(app, champion, region) {
  return _.merge(champion, _.get(app, `champions.${region}.data.${champion.championId}`, {}))
}

function setRelations(app, summonerData) {
  const setRelationForPlayer = app.recommendationEngine.setRelation.bind(app.recommendationEngine, summonerData.id)
  console.log(`Clearing old relations from Event Store for ${summonerData.name}...`)
  app.recommendationEngine.clearRelations(summonerData.id)
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

// initialize all of the routes we want to include on the app

function init(app) {
  app.get('/api/champion-recommendations/:playerId/:region', (req, res) => {
    return app.recommendationEngine.getRecommendationList(req.params.playerId)
      .then(recommendations => {
        const champions = _.map(recommendations.recommendations, recommendation => {
          return getChampionDataByIdAndRegion(app, {championId: recommendation.thing}, req.params.region)
        })
        res.send(champions)
      })
  })

  app.get('/api/config/:key', (req, res) => {
    const key = _.get(req, 'params.key')
    res.send(config.get(req.params.key))
  })

  app.get('/api/summoner/by-name/:name/:region', (req, res) => {
    const name = _.get(req, 'params.name', '').toLowerCase()
    const region = _.get(req, 'params.region')
    return riotApi.getSummonerDataByName(name, region)
      .then(summonerData => {
        if(!_.isEmpty(summonerData.champions)) {
          summonerData.champions = _.map(summonerData.champions, champion =>
            getChampionDataByIdAndRegion(app, champion, region))
        }

        res.send(summonerData)
        setRelations(app, summonerData)
      })
  })

  app.get('/api/summoner/:id/:region', (req, res) => {
    const id = _.get(req, 'params.id', '').toLowerCase()
    const region = _.get(req, 'params.region')
    return riotApi.getSummonerDataById(id, region)
      .then(summonerData => {
        if(!_.isEmpty(summonerData.champions)) {
          summonerData.champions = _.map(summonerData.champions, champion =>
            getChampionDataByIdAndRegion(app, champion, region))
        }

        res.send(summonerData)
        setRelations(app, summonerData)
      })
  })

  app.get('/api/challenger/populate', (req, res) => {
    res.status('204').send('Accepted')
    const region = 'na'
    const challengerChunks = _.chunk(app.challenger, config.get('MAX_CHUNK_SIZE'))
    return Promise.map(challengerChunks, chunk => {
      return Promise.map(chunk, player => {
        return riotApi.getSummonerDataById(player.playerOrTeamId, region)
          .then(summonerData => {
            if(!_.isEmpty(summonerData.champions)) {
              summonerData.champions = _.map(summonerData.champions, champion =>
                getChampionDataByIdAndRegion(app, champion, region))
            }
            return Promise.delay(config.get('REQUEST_DELAY'), setRelations(app, summonerData))
          })
        }, {concurrency: 1})
    }, {concurrency: 1})

  })

  app.get('/api/champions', (req, res) => {
    return res.send(app.champions)
  })

}

module.exports = {
  init
}