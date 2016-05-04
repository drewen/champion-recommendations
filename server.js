const config = require('./config');
const express = require('express');
const app = express();
const RecommendationEngine = require('./src/recommendationEngine')
const routes = require('./src/routes')
const riotApi = require('./src/riotApi')
const tasks = require('./src/tasks')
const requestPromiseCache = require('./src/requestPromiseCache')


app.use(express.static('public'));

// Recommendation Engine, which saves events and provides analytics to recommend
// a champion for a particular summoner
app.recommendationEngine = new RecommendationEngine()
app.recommendationEngine.init().then(() => {

  // Caching layer for API requests. This initializes the Postgres DB for storage
  requestPromiseCache('', { init: true }).then(() => {

    routes.init(app)

    tasks.fetchChampions(app)

    // Start up the continual refresh of the baseline, which fetches a random
    // set of challenger-level players and adds them to the recommendation engine
    tasks.fetchChallenger(app)

    // Periodically clear expired data from database
    tasks.clearExpiredData()

    // And start up our server.
    const serverPort = config.get('PORT')

    app.listen(serverPort, function () {
      console.log(`Listening on port ${serverPort}`);
    });
  })
})

