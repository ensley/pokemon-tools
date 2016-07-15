$(function() {
    $('#js-wildPoke').typeahead({
        minLength: 3,
        highlight: true
    },
    {
        name: 'pokelist',
        source: data
    });
});
