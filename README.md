# League of Legends Champion Recommendations

Created for submission to [Riot's API Challenge](https://developer.riotgames.com/discussion/announcements/show/eoq3tZd1)

## Setup:

#### Requirements:
* [NodeJs > 4](https://nodejs.org/en/)
* [PostgreSQL > 9.4](http://www.postgresql.org/)

#### Running locally:
1. Clone this repository: `git clone https://github.com/drewen/champion-recommendations`
2. Install dependencies: `npm install`
3. Add [Riot API Key](https://developer.riotgames.com/docs/api-keys): `export RIOT_API_KEY=<Your-key-here>`
4. Start the server: `npm start`
5. Open in browser at `localhost:5000`

#### Configuration:
To configure one of the below options, ensure they are in your local environment prior to starting via `export CONFIG_NAME=value`
* General Configs:
    * **PORT**: Local port for server to listern on, default '5000'
    * **RIOT_API_KEY**: User-specific API Key for Riot's API, default '' (*REQUIRED*)
    * **BULK_REQUEST_DELAY**: Delay in milliseconds between continual requests, default 5000
    * **CACHE_TIME_TO_LIVE**: Number of minutes requests should be kept in the cache, default 30
    * **EVENTS_TIME_TO_LIVE**: Number of minutes champion events should be relevant to recommendations, default 30
    * **NEIGHBOURHOOD_SEARCH_SIZE**: Number of data points to use for recommendations, default 5000
* Database Configs:
    * **DATABASE_URL**: Connection string for PostgreSQL. If not defined, as an environment variable, the system will use connection info below:
    * **POSTGRES_HOST**: Host for PostgreSQL database, default 'localhost'
    * **POSTGRES_PORT**: Port for PostgreSQL database, default '5432'
    * **POSTGRES_USER**: Username for PostgreSQL database, default ''
    * **POSTGRES_PASSWORD**: Password for PostgreSQL database, default ''
    * **POSTGRES_DB**: Name of PostgreSQL database, default 'test'

## How it works:



## Development Process:

#### Recommendation Engine

We decided early on our baseline would be the champion masteries, but what kinds of weighting and variability could we apply? Do we also include item purchases and assigned positions in Draft/Ranked games? Should we have a broader focus and look at champion roles instead of specific champions? What is really the most important part of (almost) blindly choosing a champion?

The initial engine we looked at was [Raccoon](https://github.com/guymorita/recommendationRaccoon). This library provides a solid interface for recommendations based on a simple binary system, whether a user has a positive or negative interaction with an item, in this case a champion. If they won or had a high rank with a champion, they would be considered to have 'liked' that champion. If they lost or had a low ranking with a champion, they would be considered to have 'disliked' that champion. It was specifically made for large data sets and provides very quick calculations, but at a cost of less customizability and overall less accuracy. While this might work for something like YouTube or Facebook, ultimately our dataset was far smaller and more complex, requiring more flexibility. We had 5 different ranks, all of which had a degree of 'like'. We also didn't think a 'win' should be considered as highly as a level 5 rank, but still wanted to include that in recommendations. What we needed was something that could take a list of varying kinds of interactions with a champion, a role, or an item and paint a clearer picture of a Summoner to compare with others.

Then we came across [Good Enough Recommendations (GER)](https://github.com/grahamjenson/ger). While both Raccoon and GER rely on the [Jaccard Index](https://en.wikipedia.org/wiki/Jaccard_index) to get a baseline of similarity between users, GER uses a slightly modified version that allows for different weights for different actions, decaying importance over time, and filtering results based on previous actions. This gave us the finer control we were looking for to make this system work.

Our first attempt at integrating the GER engine involved combining a summoners top 10 champions (and their ranks) with their last 10 games, also including the different champion roles they like to play (assassin, marksman, tank, etc.). We planned to base the recommendations on Challenger-level players, whose data would periodically be fetched from the Riot API, and other summoners already in the system. In this scenario, each summoner could have up to 20 champion actions (top 10 champion plus last 10 games played), and up to 40 champion role actions (maximum 2 roles per champion). After some testing and tuning, we found the roles to be overwhelming the set algorithm as there were necessarily more data point, even if they we weighted far lower than champion results. Instead of providing a champion for someone to play, it was providing a list of different roles they should try. After a couple more tweaks, we decided to drop the roles and focus on using just champions.

This part of the project had by far the most tweaking and adjusting and refactoring. At the core, the GER engine gave us exactly what we needed, and it came down to figuring out exactly how much to weigh each rank, how long to keep "events" valid, and how many similar champions made someone "similar". We think we came to the right balance, but this system is always open for adjustment.

#### Rate Limits and Caching

Part of the challenge in putting together all of the data for this app was how often and how in depth we should fetch baseline data. We knew we had to get information about any summoner on-demand, but we also had to continually refresh from current games to ensure we always had enough data to create a relevant recommendation. Our baseline comes from challenger-level players and their playstyle, which means we need to have a recurring, generally fresh data. In order to get this data and not constantly exceed our rate limit for a developer account, we had to create a minor caching layer. We also had to ensure we were not running an excessive amount of simultaneous requests, while not sacrificing individual on-demand user access.

To meet this need, we ensured that the continual fetching of current challenger data was never trying to access more than one player at a time and had a time delay between requests. We accomplished this via [Bluebird](http://bluebirdjs.com/)'s Promise.map combined with a Promise.delay, which takes the list of challenger players and runs each of them through an API request to get their game and champion data, then pauses for a few seconds before running the request for the next player. We also implemented a basic cache on the API requests, which kept track of recently-accessed routes and their responses, skipping the request and instead responding with the cached data. 

Once we had tried a few iterations of this, we realized we could parallelize across different regions due to the rate limit not applying across regions. With this knowledge, we optimized the data fetching to continually retrieve a large sample of player data while remaining entirely within the realm of Riot's rate limits.

While there were many opportunities to say "Let's just get a production key", the challenges we faced by encountering this constraint ensured we made every attempt possible to create a more durable, rigid end result.

#### Intuitive and Informative UI

