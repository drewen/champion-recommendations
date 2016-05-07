const _ = require('lodash')

const riotApi = require('./riotApi')
const tasks = require('./tasks')
const config = require('../config')
const Promise = require('bluebird')
const errors = require('request-promise/errors')

function getChampionDataByIdAndRegion(app, champion, region) {
  return _.merge(champion, _.get(app, `champions.${region}.data.${champion.championId}`, {}))
}

// initialize all of the routes we want to include on the app

function init(app) {
  app.get('/api/recommendations/:playerId/:region', (req, res) => {
    return app.recommendationEngine.getRecommendationList(req.params.playerId)
      .then(recommendations => {
        const champions = _.map(recommendations.recommendations, recommendation => {
          return getChampionDataByIdAndRegion(app, {championId: recommendation.thing}, req.params.region)
        })
        res.send(champions)
      })
      .catch(errors.StatusCodeError, err => {
        return res.status(err.statusCode).send(err.error);
      })
      .catch(errors.RequestError, err => {
        return res.status(500).send(err.error);
      })
  })

  app.get('/api/summoner/:name/:region', (req, res) => {
    const name = _.get(req, 'params.name', '').toLowerCase().replace(/\s/g, '')
    const region = _.get(req, 'params.region')
    return riotApi.getSummonerDataByName(name, region)
      .then(summonerData => {
        if(!_.isEmpty(summonerData.champions)) {
          summonerData.champions = _.map(summonerData.champions, champion =>
            getChampionDataByIdAndRegion(app, champion, region))
        }

        res.send(summonerData)
        tasks.setRelations(app, summonerData)
      })
      .catch(errors.StatusCodeError, err => {
        return res.status(err.statusCode).send(err.error);
      })
      .catch(errors.RequestError, err => {
        return res.status(500).send(err.error);
      })
  })
}

module.exports = {
  init
}