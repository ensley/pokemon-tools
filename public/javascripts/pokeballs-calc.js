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
