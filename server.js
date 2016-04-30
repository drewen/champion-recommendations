const express = require('express');
const app = express();

const listenPort = 3000;

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.render('index.html');
});

app.get('/api/champion-recommendation', function(req, res) {
  const mockResponse = require('./mocks/champion-recommendation.json')
  res.send(mockResponse)
})

app.listen(listenPort, function () {
  console.log(`Listening on port ${listenPort}`);
});


