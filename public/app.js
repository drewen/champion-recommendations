$(document).ready(function() {
  window.currentChart = null;
  window.currentSummoner = '';

  Chart.defaults.global.legend.display = false;
  Chart.defaults.global.tooltips.enabled = false;

  $('#openhowitworks').click(function(e) {
    e.preventDefault();
    $('#howitworks').fadeIn(1500);
    $('#bar').hide();
    $('#content').hide();
    $('#credits').hide();
  });

  $('#closehowitworks').click(function(e) {
    e.preventDefault();
    $('#howitworks').hide();
    $('#bar').fadeIn(1500);
    $('#content').fadeIn(1500);
    $('#credits').fadeIn(500);
  });

  $('#gradient').click(function() {
    $('#closehowitworks').click();
  });

  $('.submitting').click(function() {
    var summonername = $('.summonername').val();
    var region = $('.region').val();
    if (!region || !summonername) {
      return false;
    }

    $('#error').empty();
    $('#error').hide();

    $('#profile').fadeIn(1500);
    $('#recommendations').fadeIn(1500);
    $('#prevplayed').empty();
    $('.recs').hide();
    $('.playstyle').hide();
    $('.loading').show();

    $.get('api/summoner/' + summonername + '/' + region, function(summonerData) {
      setTimeout(function() {
        createProfilePanel(summonerData.champions);
        fetchRecommendations(summonerData.id, region);
      }, 1500);
    }).fail(function() {
      notFoundError();
    });
  });

  function createProfilePanel(champions) {
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

    currentChart && currentChart.destroy();

    $('#profile .loading').hide();
    $('.playstyle').fadeIn(1000);

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

      setTimeout(function() {
        var recommendationPanels = $('.recs');
        $('#recommendations .loading').hide();
        if (!recommendations[0]) {
          return noRecommendationsError();
        }
        $.each(recommendationPanels, function(index, panelEl) {
          var champion = recommendations[index];
          if (!champion) {
            return;
          }
          createRecommendationPanel($(panelEl), champion);
        });
      }, 500);
    }).fail(function() {
      noRecommendationsError();
    })
    ;
  }

  function showError(errorText, imageSrc) {
    var errorEl = $('<div />');
    var errorImageEl = $('<img />');
    errorImageEl.attr('src', imageSrc);
    errorImageEl.appendTo(errorEl);
    var errorTextEl = $('<span />');
    errorTextEl.text(errorText);
    errorTextEl.appendTo(errorEl);
    errorEl.appendTo('#error');
    $('#error').show();
    $('#profile').hide();
    $('#recommendations').hide();
  }

  function notFoundError() {
    var errorMessages = [
      {
        key: 'AurelionSol',
        text: 'Aurelion Sol has searched the universe, but could not find that summoner. Make sure you chose the right region and try again.'
      },
      {
        key: 'Teemo',
        text: 'Teemo has scouted high and low, but could not find that summoner. Make sure you chose the right region and try again.'
      },
      {
        key: 'Ezreal',
        text: 'Ezreal has explored the reaches of Runeterra, but could not find that summoner. Make sure you chose the right region and try again.'
      },
      {
        key: 'Braum',
        text: 'Braum has braved the chill of the Freljord, but could not find that summoner. Make sure you chose the right region and try again.'
      },
      {
        key: 'Kindred',
        text: 'Kindred has gone on a hunt, but could not find that summoner. Make sure you chose the right region and try again.'
      }
    ];

    var errorInfo = errorMessages[Math.floor(Math.random() * 5)] || errorMessages[0];
    showError(errorInfo.text, 'http://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/' + errorInfo.key + '.png')
  }

  function noRecommendationsError() {
    var errorText = 'Ryze has checked over his spell scroll, but could not come up with any recommendations. Try playing a few more games and come back to try again.';
    var imageSrc = 'http://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/Ryze.png';
    showError(errorText, imageSrc);
  }

  function createRecommendationPanel(panelEl, champion) {
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

    panelEl.fadeIn(1500);
  }
});