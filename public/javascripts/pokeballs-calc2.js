var pokeballApp = (function() {

    var config = {
        '$wildPokeContainer': $( '#js-wildPoke' ),
        '$hpTextContainer': $( '#js-hpRemaining' ),
        '$wildPokeLevelContainer': $( '#js-wildPokeLevel' )
    };

    var $hp;
    var $hp_inner_bar;

    var initialize = function( options ) {
        if( options && typeof( options ) === 'object' ) {
            $.extend( config, options );
        }

        $hp = $( '<div/>', {
            class: 'js-dynamic-hp-bar'
        }).append(
            $( '<div/>', {
                class: 'js-dynamic-hp-inner-bar'
            })
        );

        $hp.css( 'display', 'none' );
        $hp.click( click_hp_bar );
        config.$hpTextContainer.after( $hp );
        config.$hpTextContainer.keyup( update_hp_bar );

        $('form').submit( click_submit );
    };

    var update_hp_bar = function() {
        if( !$hp.length ) return;

        var value = parseInt( config.$hpTextContainer.val() );

        if( !value || value < 0 || value > 100 ) {
            $hp.css( 'display', 'none' );
            return;
        }

        $hp.css( 'display', '' );

        $hp_inner_bar = $hp.find( '.js-dynamic-hp-inner-bar' );
        var bar_width = Math.ceil( value / 100 * 48 );
        $hp_inner_bar.css( 'width', bar_width * 2 );
        $hp_inner_bar.removeClass( 'low_hp medium_hp high_hp' );
        $hp_inner_bar.addClass( getHPBarClass( value ) );
    };

    var click_hp_bar = function( e ) {
        var $this = $( this );
        var offset_x = e.pageX - $this.offset().left - $hp_inner_bar.position().left;
        $hpTextContainer.val( Math.max( 1, Math.min( 100, Math.round( offset_x * 100 / 96 ) ) ) );

        update_hp_bar();
    };

    var click_submit = function( e ) {
        var formData = {
            'wildPokemon': config.$wildPokeContainer.val(),
            'hpRemaining': config.$hpTextContainer.val(),
            'wildPokemonLevel': config.$wildPokeLevelContainer.val()
        };
        submit_data( formData );
        e.preventDefault();
    };

    var submit_data = function( formData ) {
        $.ajax({
            type: 'POST',
            url: '/pokeballs',
            data: formData,
            dataType: 'json',
            encode: true
        }).done( function( data ) {
            write_results( data );
        } );
    };

    var write_results = function( data ) {
        var rate = Math.round( data.rate * 100) / 100;
        $( '#results-container' ).text( 'About a ' + rate + '% chance of capture.' );
    };

    var getHPBarClass = function( hp ) {
        if( hp < 20 ) {
            return 'low_hp';
        } else if( hp < 50 ) {
            return 'medium_hp';
        } else {
            return 'high_hp';
        }
    };

    return {
        initialize: initialize
    };

})();

$(function() {
    pokeballApp.initialize();
});
