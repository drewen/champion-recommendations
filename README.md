# League of Legends Champion Recommendations

![alt text](https://github.com/drewen/champion-recommendations/development/public/icons/header.png "What Champion Should You Play?")

Created for submission to [Riot's API Challenge](https://developer.riotgames.com/discussion/announcements/show/eoq3tZd1) by Andrew Smith (fgsdfgerg) and Zach Deocadiz (firiath)

**Check out the demo [here](https://leaguechampionrecommendations.herokuapp.com)**

## Local Setup:

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



#This tool recommends champions to Summoners based off of their champion masteries and most recent games. 

##Why did we choose to do this?
While coming up with ideas for what to do with champion masteries, we had to grapple with the following problems:

—Champion masteries may not mean very much for advanced players because of things like smurf accounts, lots of play time, and the current level 5 limit. Players with one old main account will simply have lots of champions at level 5, since they have time to simply play all the champions they want, while people on smurf accounts will not have all their masteries available for others to see. Also, people who reach mastery in one champion, but don’t play it for a long time won’t necessarily be as good mechanically as someone who may not have played it as much, but has mained it much more recently. Essentially, champion masteries simply won’t tell you how skilled someone is at a particular champion at high levels.

—For intermediate players—players that might not be all that skilled, but know enough about the game to know the basic differences between champions—champion masteries are more of a bragging point, but not a very effective one unless they display it in game since it’s hard to see unless you’re friends with them. Also, it’s often used more to tell you about the play styles of other people you play with, rather than being important to you.

—Because you can’t get negative amounts of champion mastery points when you play a game, champion mastery points are simply additive—just play a champion enough and you’ll eventually get a high mastery. Champion masteries don’t necessarily say how skilled you are at a champion—simply that you enjoy playing it enough to play it multiple times. 

Because of this, we concluded that champion masteries have the most meaning when they’re used to tell you more about a player—what champions they enjoy playing enough to get a mastery in can tell you about which roles they are likely to play. 

We also acknowledged that this information is only useful to a player if it’s about someone else, or if it can be used to tell them more about their own play style. Because there are plenty of inferences that people already make by looking up their opponents online, we chose to focus on telling people more about their play style. Continuing along with this, we realized that this would have to be something that targeted newer or intermediate players—advanced players probably know enough about their own play style to know what champions they like playing, or they’ve simply tested out a multitude of champions to come to those same conclusions. This helped us narrow our focus on just supplying recommended champions to players based off of their masteries.

## How it works:

![alt text](https://github.com/drewen/champion-recommendations/development/001.png "How it Works")

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

#### Design

**Aesthetic Design**
We had the following limitations:
*We could not make anything that looked like in-game mechanics.
*We could not use the League of Legends or Riot Games logos at all in our design.
*Because of time limitations, all images needed to be directly from Riot’s API—that meant that our design needed to accommodate for very different image aesthetics.

With this in mind, we tried to keep the same aesthetic feeling, while still making it obvious that this tool is our own creation. This led to using Adobe Garamond Pro for the typeface, to follow along with the League of Legends website design. Although we chose to use a similar purple-yellow color scheme as the League of Legends website, we changed the hues and values to have a slightly different aesthetic feeling. A warmer and deeper purple matched with a duller yellow gave us a more modern-feeling aesthetic, while still retaining some of the old-style feeling of the League of Legends brand. We also used icons, charts, and other visual tools to make things easier to read. Images were dealt with all the same, but they weren’t put in any situation where they would necessarily look out of place. Different champion splash art was explored to make sure there were no abruptly clashing colors, but having a similar color scheme to League of Legends helped with this.

**Usability**
To make things as simple and as intuitive as possible, the design had to completely focus on the one interaction that users really needed—to input their summoner name and get data in response. That meant that we had to put all the focus on the splash screen on the input menu.

Because a significant user group that we were targeting was going to be beginning Summoners, we had to give enough information about the different champions to help them be excited to try a champion out, but not too much that they would be overloaded with information. To this end, we chose to display only the following things:
*Champion name
*Champion splash art. This can be used to ‘sell’ someone on a champion because they might be attracted to the aesthetic of the champion.
*Roles (assassin, fighter, mage, marksman, support, tank). This suggests certain things about the play style of a champion and if it’s similar to other
*Attack damage, Magic damage, Defense, and Difficulty levels. This also lets people know more about the champions

Because things like the roles, attack damage, magic damage, defense, and difficulty levels are hard for beginner Summoners to understand off the bat, we made sure to include an explanation of how to use the tool. This is linked at the bottom of every page.

We chose not to display the following things:
*Item builds. League already has suggested items in-game, which is enough to try out a champion to see how they play.
*Lore. Other websites (such as the League of Legends official website) have this info hosted—we don’t need to copy the work. Also it doesn’t tell you much about their play style, so it wasn’t necessary. Instead, clicking on the champion brings you to their champion page on the League of Legends website.
*Skins. This can help people enjoy their champion more, but doesn’t actually tell you anything about a champion’s play style.
*Abilities. While this is useful to understanding how a champion may or may not play, it seemed like too much information to display on the page, when the Summoner may or may not really understand what all of it means. It would also mean that the Summoner would have to wade through lots of information to get to their next recommendation. Instead, clicking on the champion brings you to their champion page on the League of Legends website.


**Fun and Delight**
The loading screen uses a Poro with hearts floating out of it.
![alt text](https://github.com/drewen/champion-recommendations/development/002.gif "Poro loading")

The error page, in case someone entered in an invalid Summoner name for the region they selected or if their account hasn't passed the tutorial stage, selects a random error message. Thresh, Teemo, Braum, Ezreal, Ryze, and Aurelion Sol have something to say if you give us wrong information.
![alt text](https://github.com/drewen/champion-recommendations/development/003.png "Braum Error Message")
![alt text](https://github.com/drewen/champion-recommendations/development/004.png "Ryze Error Message")
![alt text](https://github.com/drewen/champion-recommendations/development/005.png "Kindred Error Message")
![alt text](https://github.com/drewen/champion-recommendations/development/006.png "Teemo Error Message")
![alt text](https://github.com/drewen/champion-recommendations/development/007.png "Ezreal Error Message")
![alt text](https://github.com/drewen/champion-recommendations/development/008.png "Aurelion Sol Error Message")

