var express = require('express');
var router = express.Router();

var captureProb = (function() {

    var statusBonuses = {
        'none': 1,
        'Paralysis': 1.5,
        'Poison': 1.5,
        'Burn': 1.5,
        'Sleep': 2,
        'Freeze': 2
    };

    var ballBonuses = {
        'master-ball':  1,
        'ultra-ball':   2,
        'great-ball':   1.5,
        'poke-ball':    1,
        'safari-ball':  1.5,
        'park-ball':    1,
        'sport-ball':   1.5,
        'net-ball':     1,
        'dive-ball':    1,
        'nest-ball':    1,
        'repeat-ball':  1,
        'timer-ball':   1,
        'luxury-ball':  1,
        'premier-ball': 1,
        'dusk-ball':    1,
        'heal-ball':    1,
        'quick-ball':   1,
        'dream-ball':   1,
        'lure-ball':    1,
        'level-ball':   1,
        'moon-ball':    1,
        'heavy-ball':   1,
        'fast-ball':    1,
        'friend-ball':  1,
        'love-ball':    1
    };

    var captureObject = {};

    var toProperCase = function ( str ) {
        str = str.replace(/-/g, ' ');
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };

    var calculate = function( db, pq, body, ball, callback ) {

        var hpFrac = body.hpRemaining / 100;
        var status = body.status;

        var balls = Object.keys( ballBonuses );
        var ballProbs = [];

        var query = pq.getCaptureStats( body.wildPoke );
        console.log( query );
        db.all( query.text, {
            $1: query.values[0]
        }, function( err, rows ) {
            console.log( rows );

            var row = rows[0];
            var types = [];
            rows.map( function( row ) {
                types.push( row.type );
            } );

            balls.map( function( ball ) {
                var ballObj = {};
                var baseRate = row.capture_rate;

                ballObj.name = toProperCase( ball );

                if( ball === 'level-ball' ) {
                    var modRates = [ 1, 2, 4, 8 ].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [ 'Your level \u2264 target level',
                    'Target level \x3C your level \u2264 2 \xD7 target level',
                    '2 \xD7 target level \x3C your level \u2264 4 \xD7 target level',
                    '4 \xD7 target level \x3C your level' ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    body.wildLevel = parseInt( body.wildLevel );
                    body.yourLevel = parseInt( body.yourLevel );

                    if( isNaN(body.wildLevel) || isNaN(body.yourLevel) ) {
                        console.log( 'levels not specified' );
                        ballObj.cases.map( function( c ) {
                            c.isActive = false;
                        } );
                    } else if( body.yourLevel <= body.wildLevel ) {
                        console.log( 'your level less than wild level' );
                        ballObj.cases[0].isActive = true;
                    } else if( body.yourLevel <= 2 * body.wildLevel ) {
                        ballObj.cases[1].isActive = true;
                    } else if( body.yourLevel <= 4 * body.wildLevel ) {
                        ballObj.cases[2].isActive = true;
                    } else {
                        ballObj.cases[3].isActive = true;
                    }

                } else if( ball === 'lure-ball') {

                    var modRates = [3, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [ 'Fishing',
                    'Otherwise' ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( body.terrain === 'fishing' ) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'love-ball' ) {

                    var modRates = [8, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [ 'Target is same species and opposite gender',
                    'Otherwise' ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( body.oppSex ) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'heavy-ball' ) {

                    var modRates = [-20, 20, 30, 40].map( function( add ) {
                        return modifiedCatchRate( hpFrac, baseRate + add, statusBonuses[ status ], 1 );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [
                        'Target weight \u2264 204.8 kg',
                        '204.8 kg \x3C target weight \u2264 307.2 kg',
                        '307.2 kg \x3C target weight \u2264 409.6 kg',
                        '409.6 kg \x3C target weight'
                    ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( row.weight <= 204.8 ) {
                        ballObj.cases[0].isActive = true;
                    } else if( row.weight <= 307.2 ) {
                        ballObj.cases[1].isActive = true;
                    } else if( row.weight <= 409.6 ) {
                        ballObj.cases[2].isActive = true;
                    } else {
                        ballObj.cases[3].isActive = true;
                    }

                } else if ( ball === 'fast-ball' ) {

                    var modRates = [4, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [
                        'Target base speed \x3E 100',
                        'Otherwise'
                    ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( row.base_speed >= 100 ) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'net-ball' ) {

                    var modRates = [3, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [
                        'Target is Water or Bug type',
                        'Otherwise'
                    ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( types.indexOf( 'bug' ) !== -1 || types.indexOf( 'water' ) !== -1 ) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'nest-ball' ) {

                    var level = body.wildLevel || 5;
                    console.log( level );

                    var mult = Math.max(( 40 - level ) / 10, 1);
                    var modRate = modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );

                    var shakeProb = shakeCheck( modRate );
                    var shakeArray = calculateShakeArray( shakeProb );
                    ballObj.shakes = shakeArray;
                    ballObj.notes = 'Better against lower-level targets. Worst at level 30+';

                } else if( ball === 'repeat-ball' ) {

                    var modRates = [3, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [
                        'Target has been caught previously',
                        'Otherwise'
                    ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( body.inDex ) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'timer-ball' ) {

                    var turn = body.battleTurn || 1;
                    console.log( turn );

                    var mult = Math.min((turn + 10)/10, 4);
                    var modRate = modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );

                    var shakeProb = shakeCheck( modRate );
                    var shakeArray = calculateShakeArray( shakeProb );
                    ballObj.shakes = shakeArray;
                    ballObj.notes = 'Better in later turns. Caps at turn 30';


                } else if( ball === 'dive-ball' ) {

                    var modRates = [3.5, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [
                        'Currently fishing or surfing',
                        'Otherwise'
                    ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( body.terrain === 'surfing' || body.terrain === 'fishing' ) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'dusk-ball' ) {

                    var modRates = [3.5, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [
                        'Currently nighttime or inside a cave',
                        'Otherwise'
                    ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( body.nightOrCave ) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'quick-ball' ) {

                    var modRates = [4, 1].map( function( mult ) {
                        return modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], mult );
                    } );

                    ballObj.cases = [];

                    var shakeProbs = modRates.map( shakeCheck );

                    shakeProbs.map( function( prob, i ) {
                        var keyname = 'level' + i;
                        var shakeArray = calculateShakeArray( prob );

                        var caseObj = {};
                        caseObj.shakes = shakeArray;


                        ballObj.cases.push( caseObj );
                    } );

                    [
                        'First turn of battle',
                        'Otherwise'
                    ].map( function( txt, i ) {
                        ballObj.cases[i].notes = txt;
                    } );

                    if( parseInt(body.battleTurn) === 1) {
                        ballObj.cases[0].isActive = true;
                    } else {
                        ballObj.cases[1].isActive = true;
                    }

                } else if( ball === 'master-ball' || ball === 'park-ball' || ball === 'dream-ball' ) {

                    ballObj.shakes = [ 0, 0, 0, 0, 100 ];

                } else {
                    var modRate = modifiedCatchRate( hpFrac, baseRate, statusBonuses[ status ], ballBonuses[ ball ]);
                    var shakeProb = shakeCheck( modRate );
                    var shakeArray = calculateShakeArray( shakeProb );
                    ballObj.shakes = shakeArray;
                }

                ballProbs.push( ballObj );
            } );

            // console.log(ballProbs);

            callback( ballProbs );
        });

    };

    var modifiedCatchRate = function( hpFrac, rate, statusMultiplier, ballMultiplier ) {
        var result = Math.min(( 1 - 2 / 3 * hpFrac ) * rate * statusMultiplier * ballMultiplier, 255);
        return result;
    };

    var shakeCheck = function( rate ) {
        return Math.floor(1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / rate))))));
    };

    var calculateShakeArray = function( prob ) {
        var p = prob / 65536;
        var arr = [
            1 - p,
            p * (1 - p),
            Math.pow(p, 2) * (1 - p),
            Math.pow(p, 3) * (1 - p),
            Math.pow(p, 4)
        ];
        return arr.map( function( val ) { return val * 100; });
    };

    return {
        calculate: calculate
    };

})();

/* GET Pokemon page. */
router.get('/', function(req, res) {

    var queryAllPokemon = res.locals.pq.getAllPokemon();
    var queryAllAilments = res.locals.pq.getAllAilments();

    var sendQuery = function( query ) {
        return function( callback ) {
            var result = [];
            res.locals.db.all( query, function( err, rows ) {
                rows.map( function( row ) {
                    result.push( row.name );
                } );
                callback( null, result );
            } );
        };
    };

    res.locals.async.parallel({
        ailments: sendQuery( res.locals.pq.getAllAilments() ),
        pokelist: sendQuery( res.locals.pq.getAllPokemon() )
    }, function( err, results ) {
        res.render( 'pokeballs', {
            'ailments': results.ailments,
            'pokelist': results.pokelist
        } );
    } );

});

router.post('/', function(req, res) {

    captureProb.calculate( res.locals.db, res.locals.pq, req.body, undefined, function( r ) {
        // res.send({ rate: r });
        res.send({ ballProbs: r });
    });

});

module.exports = router;
