// matcher function for typeahead
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

var pokeballs_calc = {
    // Create the HP-remaining bar and hide it by default
    'initialize': function() {
        // $this => the textbox
        var $this = $(this);
        // $hp => the hp bar (not the colored part)
        var $hp = $('<div/>', {
            class: 'js-dynamic-hp-bar'
        }).append(
            $('<div/>', {
                class: 'js-dynamic-hp-inner-bar'
            })
        );
        // hide it by default
        $hp.css('display', 'none');
        // set the click behavior
        $hp.click(pokeballs_calc.click_hp_bar);
        // put the hp bar after the textbox in the DOM
        $this.after($hp);

        // update the bar on each keyup
        $this.keyup(function() {
            pokeballs_calc.update_hp_bar($this);
        });

        // go ahead and update it now. 100 is the default textbox value
        pokeballs_calc.update_hp_bar($this);
    },
    // update the HP-remaining bar based on the value in the textbox
    'update_hp_bar': function($textbox) {
        // again, $hp is the (outer) hp bar
        var $hp = $textbox.siblings('.js-dynamic-hp-bar').eq(0);
        // do nothing if we can't find the hp bar
        if (! $hp.length) return;

        var value = parseInt($textbox.val());
        // if the value is invalid, hide the whole bar
        if (! value || value < 0 || value > 100) {
            $hp.css('display', 'none');
            return;
        }
        // show the bar
        $hp.css('display', '');

        $hp_inner_bar = $hp.find('.js-dynamic-hp-inner-bar');
        var bar_width = Math.ceil( value / 100 * 48 );
        $hp_inner_bar.css('width', bar_width * 2);
        $hp_inner_bar.removeClass('low_hp medium_hp high_hp');
        $hp_inner_bar.addClass(getHPBarClass(value));
    },
    // set click behavior
    'click_hp_bar': function(e) {
        var $this = $(this);
        var offset_x = e.pageX - $this.offset().left - $('.js-dynamic-hp-inner-bar').position().left;
        var $textbox = $this.siblings('#js-hpRemaining');
        // update the textbox value
        $textbox.val(Math.max(1, Math.min(100, Math.round(offset_x * 100 / 96))));
        // update the bar using the newly-updated textbox value
        pokeballs_calc.update_hp_bar($textbox);
    }
};

// color the HP bar according to the % HP remaining
function getHPBarClass(hp) {
    if (hp < 20) {
        return 'low_hp';
    } else if (hp < 50) {
        return 'medium_hp';
    } else {
        return 'high_hp';
    }
}

$(function() {
    // typeahead
    $('#js-wildPoke').typeahead({
        minLength: 1,
        highlight: true,
        hint: true
    },
    {
        name: 'pokelist',
        source: substringMatcher(data)
    });
    // push the form data to the server for processing
    $('form').submit(function(e) {
        var formData = {
            'wildPokemon': $('#js-wildPoke').val(),
            'hpRemaining': $('#js-hpRemaining').val(),
            'wildPokemonLevel': $('#js-wildPokeLevel').val()
        };

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

    // initialize the HP bar stuff
    $('#js-hpRemaining').each(pokeballs_calc.initialize);
});
