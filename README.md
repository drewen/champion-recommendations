League of Legends Champion Recommendation

Created for submission to [Riot's API Challenge](https://developer.riotgames.com/discussion/announcements/show/eoq3tZd1)

Requirements:

[NodeJs > 4](https://nodejs.org/en/)
[PostgreSQL > 9.4](http://www.postgresql.org/)

Package installation:
`npm install`

Server start:
`npm start`

Configuration:
To configure one of the below options, ensure they are in your local environment prior to starting via `export CONFIG_NAME=value`

SERVER_PORT: Local port for server to listern on, default '3000'

API Configs:
RIOT_API_KEY: User-specific API Key for Riot's API, default '' (*REQUIRED*)
BULK_REQUEST_DELAY: Delay in milliseconds between continual requests, default 3000

Database Configs:
POSTGRES_HOST: Host for PostgreSQL database, default 'localhost'
POSTGRES_PORT: Port for PostgreSQL database, default '5432'
POSTGRES_USER: Username for PostgreSQL database, default ''
POSTGRES_PASSWORD: Password for PostgreSQL database, default ''
POSTGRES_DB: Name of PostgreSQL database, default 'test'



Development Process (WIP):

## Recommendation Engine

We decided early on our baseline would be the champion masteries, but what kinds of weighting and variability could we apply? Do we also include item purchases and assigned positions in Draft/Ranked games? Should we have a broader focus and look at champion roles instead of specific champions? What is really the most important part of (almost) blindly choosing a champion?

The initial engine we looked at was [Raccoon](https://github.com/guymorita/recommendationRaccoon). This library provides a solid interface for recommendations based on a simple binary system, whether a user has a positive or negative interaction with an item, in this case a champion. If they won or had a high rank with a champion, they would be considered to have 'liked' that champion. If they lost or had a low ranking with a champion, they would be considered to have 'disliked' that champion. It was specifically made for large data sets and provides very quick calculations, but at a cost of less customizability and overall less accuracy. While this might work for something like YouTube or Facebook, ultimately our dataset was far smaller and more complex, requiring more flexibility. We had 5 different ranks, all of which had a degree of 'like'. We also didn't think a 'win' should be considered as highly as a level 5 rank, but still wanted to include that in recommendations. What we needed was something that could take a list of varying kinds of interactions with a champion, a role, or an item and paint a clearer picture of a Summoner to compare with others.

Then we came across [Good Enough Recommendations (GER)](https://github.com/grahamjenson/ger). While both Raccoon and GER rely on the [Jaccard Index](https://en.wikipedia.org/wiki/Jaccard_index) to get a baseline of similarity between users, GER uses a slightly modified version that allows for different weights for different actions, decaying importance over time, and filtering results based on previous actions. This gave us the finer control we were looking for to make this system work.

Our first attempt at integrating the GER engine involved combining a summoners top 10 champions (and their ranks) with their last 10 games, also including the different champion roles they like to play (assassin, marksman, tank, etc.). We planned to base the recommendations on Challenger-level players, whose data would periodically be fetched from the Riot API, and other summoners already in the system. In this scenario, each summoner could have up to 20 champion actions (top 10 champion plus last 10 games played), and up to 40 champion role actions (maximum 2 roles per champion). After some testing and tuning, we found the roles to be overwhelming the set algorithm as there were necessarily more data point, even if they we weighted far lower than champion results. Instead of providing a champion for someone to play, it was providing a list of different roles they should try. After a couple more tweaks, we decided to drop the roles and focus on using just champions.

## Intuitive and Informative UI

## Rate Limits and Caching
