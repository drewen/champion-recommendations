const config = require('./config');
const express = require('express');
const app = express();
const RecommendationEngine = require('./src/recommendationEngine')
const routes = require('./src/routes')
const riotApi = require('./src/riotApi')
const requestPromiseCache = require('./src/requestPromiseCache')


app.use(express.static('public'));

// Recommendation Engine, which saves events and provides analytics to recommend
// a champion for a particular summoner
app.recommendationEngine = new RecommendationEngine()
app.recommendationEngine.init().then(() => {

  // Caching layer for API requests. This initializes the Postgres DB for storage
  requestPromiseCache('', { init: true }).then(() => {

    app.get('/', (req, res) => {
      res.render('index.html');
    });

    routes.init(app)

    // Fetch static champion data on boot, then once per hour after that
    const fetchChampions = () => {
      return riotApi.getAllRegionChampions()
        .then(champions => {
          app.champions = champions
          setTimeout(fetchChampions, 60 * 1000 * 60)
        })
    }

    fetchChampions()

    // Start up the continual refresh of the baseline, which fetches a random
    // set of challenger-level players and adds them to the recommendation engine
    routes.fetchChallenger(app)

    // And start up our server.
    const serverPort = config.get('SERVER_PORT')

    app.listen(serverPort, function () {
      console.log(`Listening on port ${serverPort}`);
    });
  })
})

