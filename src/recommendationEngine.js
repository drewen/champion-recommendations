'use strict'

const ger = require('ger')
const postgresConn = require('./postgresConn')

class RecommendationEngine {
  constructor() {

    const pg = postgresConn()

    // Event Store Manager
    const esm = new ger.PsqlESM({knex: pg})
    this.ger = new ger.GER(esm)
  }

  init() {
    // Create a namespace for our champion recommendations
    return this.ger.initialize_namespace('champions')
  }

  tearDown() {
    return this.ger.destroy_namespace('champions')
  }

  setRelation(playerId, action, champion) {
    return this.ger.events([{
      namespace: 'champions',
      person: playerId,
      action,
      thing: champion,
      expires_at: '2100-01-01'
    }])
  }

  clearRelations(playerId) {
    return this.ger.delete_events('champions', {person: playerId})
  }

  getRecommendationList(playerId) {
    return this.ger.recommendations_for_person('champions', playerId, {
      // Weigh the different 'events', with rank playing the biggest factor
      actions: {
        rank1: 1,
        rank2: 2,
        rank3: 3,
        rank4: 4,
        rank5: 5,
        win: 0.25,
        loss: 0.20
      },
      // Player must have at least 5 'events', which include recent games and ranked champions
      minimum_history_required: 5,
      // Use the last 250 players worth of records to calculate the recommendation
      neighbourhood_search_size: 5000,
      // Must have 10 or more similarities to be considered
      similarity_search_size: 10,
      // A player should have at most 20 records to use
      neighbourhood_size: 20,
      // Each similar player can provide 3 recommendations
      recommendations_per_neighbour: 3,
      // Don't give recommendations that are already ranked or recently played
      filter_previous_actions: [
        'win', 'loss', 'rank1', 'rank2', 'rank3', 'rank4', 'rank5'
      ],
      event_decay_rate: 1,
      time_until_expiry: 180
    })
  }
  
}

module.exports = RecommendationEngine