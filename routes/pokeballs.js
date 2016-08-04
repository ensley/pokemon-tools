var express = require('express');
var router = express.Router();

function calculateCatchProb(db, pokeQueries, wildPokemon, hpRemaining, callback) {
    var rate = 0;
    var query = pokeQueries.getCaptureStats(wildPokemon);
    db.get(query.text,
    {
        $1: query.values[0]
    },
    function(err, row) {
        console.log(row);
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
        console.log( results );
        res.render( 'pokeballs', {
            'ailments': results.ailments,
            'pokelist': results.pokelist
        } );
    } );

    // db.all(query, function(err, rows) {
    //     rows.map(function(row) {
    //         pokeList.push(row.name);
    //     });
    //     res.render('pokeballs', {
    //         'pokelist': pokeList,
    //         'ailments': ailments
    //     });
    // });
});

router.post('/', function(req, res) {
    var db = res.locals.db;
    var pokeQueries = res.locals.pq;
    var wildPokemon = req.body.wildPokemon;
    var hpRemaining = req.body.hpRemaining / 100;
    var wildPokemonLevel = req.body.wildPokemonLevel;

    calculateCatchProb(db, pokeQueries, wildPokemon, hpRemaining, function(r) {
        res.send({rate: r});
    });
});

module.exports = router;
