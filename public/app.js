$(document).ready(function() {
  $('.submitting').click(function() {
    var summonername = $('.summonername').val();
    var region = $('.region').val();
    if (!region || !summonername) {
      return false;
    }
    $.get('api/summoner/' + summonername + '/' + region, function(summonerData) {
      var champions = summonerData.champions;
      var roles = {
        Assassin: 0,
        Fighter: 0,
        Mage: 0,
        Marksman: 0,
        Support: 0,
        Tank: 0
      };

      $('#prevplayed').empty();

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

      new Chart($('#myChart'), {
        type: 'doughnut',
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

      $.get('api/recommendations/' + summonerData.id + '/' + region, function(recommendations) {

        var recommendationPanels = $('.recs');
        $.each(recommendationPanels, function(index, panelEl) {
          var champion = recommendations[index];
          createRecommendationPanel($(panelEl), champion);
        });
        $('#recommendations').show();
      });
    });
  });

  function createRecommendationPanel(panelEl, champion) {
    if (!champion) {
      return panelEl.hide();
    }
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

            // <div class="bars">
            //   <ul>
            //     <li>
            //       <div class="ad" style="width:20%;"></div><div class="filler" style="width:80%;"></div>
            //     </li>
            //     <li>
            //       <div class="def" style="width:30%;"></div><div class="filler" style="width:70%;"></div>
            //     </li>
            //     <li>
            //       <div class="ap" style="width:60%;"></div><div class="filler" style="width:40%;"></div>
            //     </li>
            //     <li>
            //       <div class="diff" style="width:40%;"></div><div class="filler" style="width:60%;"></div>
            //     </li>
            //   </ul>
            // </div>
});