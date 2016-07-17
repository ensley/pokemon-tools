var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

function getHPBarClass(hp) {
    if (hp < 20) {
        return 'low_hp';
    } else if (hp < 50) {
        return 'medium_hp';
    } else {
        return 'high_hp';
    }
}

function update_hp() {
    var percent = $('#js-hpRemaining').val();
    if (percent <= 0) {
        percent = 1;
    } else if (percent > 100) {
        percent = 100;
    }
    var hpfill = Math.ceil(percent /100 * 48);

    $('#js-hpBarBar').css('width', hpfill * 2);
    $('#js-hpBarBar').attr('class', getHPBarClass(percent));
}

$(function() {
    $('#js-wildPoke').typeahead({
        minLength: 1,
        highlight: true,
        hint: true
    },
    {
        name: 'pokelist',
        source: substringMatcher(data)
    });

    $('#js-wildPoke').bind('typeahead:select', function(e, selection) {
        console.log('Selection: ' + selection);
    });

    $('#js-hpRemaining').keyup(update_hp);

    $('#js-hpBarBar').addClass('high-hp');
    $('#js-hpBarBar').css('width', '96px');

    $('.js-hpBar').click(function(event) {
        var offset_x = event.pageX - $(this).offset().left - $('#js-hpBarBar').position().left;
        $('#js-hpRemaining').val(Math.max(1, Math.min(100, Math.round(offset_x * 100 / 96))));
        update_hp();
    });

    $('form').submit(function(e) {
        var formData = {
            'wildPokemon': $('#js-wildPoke').val(),
            'hpRemaining': $('#js-hpRemaining').val(),
            'wildPokemonLevel': $('#js-wildPokeLevel').val()
        };
        console.log(formData);

        $.ajax({
            type: 'POST',
            url: '/pokeballs',
            data: formData,
            dataType: 'json',
            encode: true
        }).done(function(data) {
            var rate = Math.round(data.rate * 100)/100;
            $('#results-container').text('About a ' + rate + '% chance of capture.');
        });

        e.preventDefault();
    });
});
