const config = require('./config');
const express = require('express');
const app = express();
const RecommendationEngine = require('./src/recommendationEngine')
const routes = require('./src/routes')
const riotApi = require('./src/riotApi')


app.use(express.static('public'));
app.recommendationEngine = new RecommendationEngine()
app.recommendationEngine.init().then(() => {

  app.get('/', (req, res) => {
    res.render('index.html');
  });

  routes.init(app)

  const fetchChampions = () => {
    return riotApi.getAllRegionChampions()
      .then(champions => {
        app.champions = champions
        setTimeout(fetchChampions, 15 * 1000 * 60)
      })
  }

  const fetchChallenger = () => {
    return riotApi.getChallengerData()
    .then(players => {
      app.challenger = players.entries
      setTimeout(fetchChallenger, 30 * 1000 * 60)
    })
  }

  fetchChampions()

  fetchChallenger()

  const serverPort = config.get('SERVER_PORT')

  app.listen(serverPort, function () {
    console.log(`Listening on port ${serverPort}`);
  });
})


