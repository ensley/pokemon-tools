var express = require('express');
var router = express.Router();

var captureProb = (function() {

    var calculate = function( db, pq, body, callback ) {

        var query = pq.getCaptureStats( body.wildPokemon );
        db.get( query.text, {
            $1: query.values[0]
        }, function( err, row ) {
            var rate = row.capture_rate;
            var a = modifiedCatchRate( body.hpRemaining / 100, rate );
            var b = shakeCheck( a );
            var prob = Math.pow( b / 65536, 4 ) * 100;
            callback( prob );
        });

    };

    var modifiedCatchRate = function( hpFrac, rate ) {
        return rate - 2 / 3 * hpFrac * rate;
    };

    var shakeCheck = function( rate ) {
        return Math.floor(1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / rate))))));
    };

    return {
        calculate: calculate
    };

})();

function calculateCatchProb(db, pokeQueries, wildPokemon, hpRemaining, callback) {
    var rate = 0;
    var query = pokeQueries.getCaptureStats(wildPokemon);
    db.get(query.text,
    {
        $1: query.values[0]
    },
    function(err, row) {
        rate = row.capture_rate;
        var a = calculateModCatchRate(hpRemaining, rate);
        if (a >= 255) callback(1);
        var b = shakeCheck(a);
        var modRate = Math.pow(b / 65536, 4) * 100;
        callback(modRate);
    });
}

function calculateModCatchRate(hpFrac, rate) {
    // return ((3 * maxHP - 2 * curHP) * rate)/(3 * maxHP);
    return rate - 2/3 * hpFrac * rate;
}

function shakeCheck(a) {
    return Math.floor(1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / a))))));
}

/* GET Pokemon page. */
router.get('/', function(req, res) {
    var db = res.locals.db;
    var pokeQueries = res.locals.pq;
    var async = res.locals.async;
    var pokeList = [];
    var queryAllPokemon = pokeQueries.getAllPokemon();
    var queryAllAilments = pokeQueries.getAllAilments();

    var results1 = function( callback ) {
        var result = [];
        db.all( queryAllAilments, function( err, rows ) {
            rows.map( function( row ) {
                result.push( row.name );
            } );
            callback( null, result );
        } );
    };

    var results2 = function( callback ) {
        var result = [];
        db.all( queryAllPokemon, function( err, rows ) {
            rows.map( function( row ) {
                result.push( row.name );
            } );
            callback( null, result );
        } );
    };

    async.parallel({
        ailments: results1,
        pokelist: results2
    }, function( err, results ) {
        res.render( 'pokeballs', {
            'ailments': results.ailments,
            'pokelist': results.pokelist
        } );
    } );

});

router.post('/', function(req, res) {

    captureProb.calculate( res.locals.db, res.locals.pq, req.body, function( r ) {
        res.send({ rate: r });
    });

});

module.exports = router;
