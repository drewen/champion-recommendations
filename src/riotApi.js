const requestQ = require('request-promise');
const requestQCache = require('./requestPromiseCache')
const Promise = require('bluebird')
const _ = require('lodash')

const config = require('../config');
const riotAPIKey = config.get('RIOT_API_KEY');

function riotApiRoute(route, params) {
  const routeList = {
    summonerByName: `https://${params.region}.api.pvp.net/api/lol/${params.region}/v1.4/summoner/by-name/${params.name}?api_key=${riotAPIKey}`,
    summonerById: `https://${params.region}.api.pvp.net/api/lol/${params.region}/v1.4/summoner/${params.playerId}?api_key=${riotAPIKey}`,
    masteriesByPlayerId: `https://${params.region}.api.pvp.net/championmastery/location/${params.location}/player/${params.playerId}/topchampions?count=10&api_key=${riotAPIKey}`,
    champions: `https://global.api.pvp.net/api/lol/static-data/${params.region}/v1.2/champion?dataById=true&champData=allytips,altimages,enemytips,image,partype,stats,tags&api_key=${riotAPIKey}`,
    recentGames: `https://${params.region}.api.pvp.net/api/lol/${params.region}/v1.3/game/by-summoner/${params.playerId}/recent?api_key=${riotAPIKey}`,
    leaguePlayers: `https://${params.region}.api.pvp.net/api/lol/${params.region}/v2.5/league/${params.league}?type=RANKED_SOLO_5x5&api_key=${riotAPIKey}`
  }

  return routeList[route]
}

const regionToLocation = {
  br: 'br1',
  eune: 'eun1',
  euw: 'euw1',
  jp: 'jp1',
  kr: 'kr',
  lan: 'la1',
  las: 'la2',
  na: 'na1',
  oce: 'oc1',
  ru: 'ru',
  tr: 'tr1'
}

function mergeSummonerData(summonerData, masteriesData, recentGamesData, opts) {
  var mergedData = summonerData
  mergedData.region = opts.region
  mergedData.champions = masteriesData
  mergedData.games = recentGamesData.games
  return mergedData
}

function getRecentGames(playerId, region, name) {
  console.log(`Fetching recent games for ${name} in ${region} region with playerId ${playerId}...`)
  return requestQCache(riotApiRoute('recentGames', { playerId, region }), { method: 'GET', json: true })
}

function getChampionMasteries(playerId, region, name) {
  const location = regionToLocation[region]
  const masteriesByPlayerId = riotApiRoute('masteriesByPlayerId', { region, playerId, location })

  console.log(`Fetching champion masteries for ${name} in ${region} region with playerId ${playerId}...`)
  return requestQCache(masteriesByPlayerId, { method: 'GET', json: true })
}

function getSummonerDataByName(name, region) {
  const summonerByNameRoute = riotApiRoute('summonerByName', {name, region});

  console.log(`Fetching summoner data for ${name} in ${region} region...`)
  return requestQCache(summonerByNameRoute, { method: 'GET', json: true })
    .then(summonerData => {
      const playerId = summonerData[name].id
      return getExtraSummonerData(name, region, playerId, summonerData[name])
    })
};

function getSummonerDataById(playerId, region) {
  const summonerByIdRoute = riotApiRoute('summonerById', {playerId, region});

  console.log(`Fetching summoner data for ${playerId} in ${region} region...`)
  return requestQCache(summonerByIdRoute, { method: 'GET', json: true })
    .then(summonerData => {
      const name = summonerData[playerId].name
      return getExtraSummonerData(name, region, playerId, summonerData[playerId])
    })
};

function getExtraSummonerData(name, region, playerId, summonerData) {
  return Promise.all([
    getChampionMasteries(playerId, region, name),
    getRecentGames(playerId, region, name)
  ])
  .then(extraSummonerData => {
    const masteriesData = extraSummonerData[0].data
    const recentGamesData = extraSummonerData[1]
    return mergeSummonerData(summonerData, masteriesData, recentGamesData, { name, region })
  })
}

function getRegionChampions(region) {
  console.log(`Fetching champions for ${region}...`)
  return requestQCache(riotApiRoute('champions', { region }), { method: 'GET', json: true })
}

function getAllRegionChampions() {
  console.log('Fetching champions for all regions...')
  return Promise.all(_.map(regionToLocation, (n, region) =>
    getRegionChampions(region)
  ))
  .then(allRegionChampions => _.zipObject(_.keys(regionToLocation), allRegionChampions))
}

function getChallengerData() {
  const region = 'na'
  const league = 'challenger'
  console.log(`Fetching ${league} data for ${region}...`)
  return requestQCache(riotApiRoute('leaguePlayers', { region, league }), { method: 'GET', json: true })
}

module.exports = {
  getSummonerDataByName,
  getSummonerDataById,
  getChallengerData,
  getAllRegionChampions,
  getRegionChampions
};
