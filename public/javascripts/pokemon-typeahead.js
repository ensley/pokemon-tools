var typeaheadApp = (function() {

    var config = {
        'container': $( '#js-wildPoke' )
    };

    var initialize = function( options ) {
        if( options && typeof( options ) === 'object' ) {
            $.extend( config, options );
        }

        createTypeahead();
    };

    var createTypeahead = function() {
        config.container.typeahead( {
            minLength: 1,
            highlight: true,
            hint: true
        }, {
            name: 'pokelist',
            source: substringMatcher( data )
        });
    };

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

    return {
        initialize: initialize
    };

})();

$(function() {
    typeaheadApp.initialize();
});
