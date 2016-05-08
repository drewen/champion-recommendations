$(document).ready(function() {
  window.currentChart = null;
  window.currentSummoner = '';

  Chart.defaults.global.legend.display = false;

  $('.submitting').click(function() {
    $('#profile').hide();
    $('#recommendations').hide();
    var summonername = $('.summonername').val();
    var region = $('.region').val();
    if (!region || !summonername) {
      return false;
    }
    $.get('api/summoner/' + summonername + '/' + region, function(summonerData) {
      createProfilePanel(summonerData.champions);
      fetchRecommendations(summonerData.id, region);
      
    });
  });

  function createProfilePanel(champions) {
    $('#prevplayed').empty();

    var roles = {
      Assassin: 0,
      Fighter: 0,
      Mage: 0,
      Marksman: 0,
      Support: 0,
      Tank: 0
    };

    $.each(champions, function(index, champion) {
      var tags = champion.tags;

      if (tags.length === 1) {
        tags[1] = tags[0];
      }

      roles[tags[0]] += 2;
      roles[tags[1]] += 1;

      if (index < 6) {
        var championIcon = $('<img />');
        championIcon.attr('src', 'http://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/' + champion.key + '.png');
        championIcon.appendTo('#prevplayed');
      }

    });
    
    $('#profile').show();
    currentChart && currentChart.destroy();

    var ctx = $('#chart');
    ctx.width('100px');
    ctx.height('100px');
    currentChart = new Chart(ctx, {
      type: 'doughnut',
      cutoutPercentage: 0,
      data: {
        labels: ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"],
        datasets: [{
          label: '# of Votes',
          data: [
            roles['Assassin'],
            roles['Fighter'],
            roles['Mage'], 
            roles['Marksman'],
            roles['Support'],
            roles['Tank']
          ],
          backgroundColor: [
            "#FFC994",
            "#BC486F",
            "#2B818C",
            "#7123AF",
            "#990069",
            "#FF9877"
          ],
          borderWidth: [0,0,0,0,0,0]
        }]
      }
    });
  }

  function fetchRecommendations(summonerId, region) {
    $.get('api/recommendations/' + summonerId + '/' + region, function(recommendations) {

      var recommendationPanels = $('.recs');
      $.each(recommendationPanels, function(index, panelEl) {
        var champion = recommendations[index];
        createRecommendationPanel($(panelEl), champion);
      });
      $('#recommendations').show();
    }).fail(function() {
      
    })
    ;
  }

  function createRecommendationPanel(panelEl, champion) {
    if (!champion) {
      return panelEl.hide();
    }
    var championInfoLink = 'http://gameinfo.na.leagueoflegends.com/en/game-info/champions/' + champion.key.toLowerCase();
    panelEl.find('a').attr('href', championInfoLink);

    var imageSource = 'http://ddragon.leagueoflegends.com/cdn/img/champion/loading/' + champion.key + '_0.jpg';
    panelEl.find('img.champion').attr('src', imageSource);

    panelEl.find('.championName').text(champion.name);
    panelEl.find('.roles').text(champion.tags.join(', '));

    panelEl.find('.ad').css('width', champion.info.attack * 10 + '%')
    panelEl.find('.def').css('width', champion.info.defense * 10 + '%')
    panelEl.find('.ap').css('width', champion.info.magic * 10 + '%')
    panelEl.find('.diff').css('width', champion.info.difficulty * 10 + '%')

    panelEl.show();
  }
});