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

    var caseSkeleton = [
        {
            shakes: [],
            notes: '',
            isActive: false
        }, {
            shakes: [],
            notes: '',
            isActive: false
        }, {
            shakes: [],
            notes: '',
            isActive: false
        }, {
            shakes: [],
            notes: '',
            isActive: false
        }
    ];

    var captureObject = {};

    var toProperCase = function ( str ) {
        str = str.replace(/-/g, ' ');
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };

    // :(
    var calculate = function( db, pq, body, ball, callback ) {

        var hpFrac = body.hpRemaining / 100;
        var status = body.status;

        var balls = Object.keys( ballBonuses );
        var ballProbs = [];

        var query = pq.getCaptureStats( body.wildPoke );

        db.all( query.text, {
            $1: query.values[0]
        }, function( err, rows ) {

            var row = rows[0];
            var types = [];
            rows.map( function( row ) {
                types.push( row.type );
            } );

            balls.map( function( ball ) {
                var ballObj = {};
                var baseRate = row.capture_rate;

                switch( ball ) {

                    case 'level-ball':
                        ballObj = calcLevelBall( hpFrac, baseRate, statusBonuses[ status ], parseInt( body.wildLevel ), parseInt( body.yourLevel ) );
                        break;

                    case 'lure-ball':
                        ballObj = calcLureBall( hpFrac, baseRate, statusBonuses[ status ], body.terrain );
                        break;

                    case 'love-ball':
                        ballObj = calcLoveBall( hpFrac, baseRate, statusBonuses[ status ], body.oppSex );
                        break;

                    case 'heavy-ball':
                        ballObj = calcHeavyBall( hpFrac, baseRate, statusBonuses[ status ], row.weight / 10 );
                        break;

                    case 'fast-ball':
                        ballObj = calcFastBall( hpFrac, baseRate, statusBonuses[ status ], row.base_speed );
                        break;

                    case 'net-ball':
                        ballObj = calcNetBall( hpFrac, baseRate, statusBonuses[ status ], types );
                        break;

                    case 'nest-ball':
                        ballObj = calcNestBall( hpFrac, baseRate, statusBonuses[ status ], parseInt(body.wildLevel) || 30 );
                        break;

                    case 'repeat-ball':
                        ballObj = calcRepeatBall( hpFrac, baseRate, statusBonuses[ status ], body.inDex );
                        break;

                    case 'timer-ball':
                        ballObj = calcTimerBall( hpFrac, baseRate, statusBonuses[ status ], parseInt(body.battleTurn) || 1 );
                        break;

                    case 'dive-ball':
                        ballObj = calcDiveBall( hpFrac, baseRate, statusBonuses[ status ], body.terrain );
                        break;

                    case 'dusk-ball':
                        ballObj = calcDuskBall( hpFrac, baseRate, statusBonuses[ status ], body.nightOrCave );
                        break;

                    case 'quick-ball':
                        ballObj = calcQuickBall( hpFrac, baseRate, statusBonuses[ status ], parseInt(body.battleTurn) || 1 );
                        break;

                    case 'moon-ball':
                        ballObj = calcMoonBall( hpFrac, baseRate, statusBonuses[ status ], row.name );
                        break;

                    case 'master-ball':
                    case 'park-ball':
                    case 'dream-ball':
                        ballObj = { name: toProperCase( ball ), shakes: [ 0, 0, 0, 0, 100 ] };
                        break;

                    default:
                        ballObj = calcNormalBall( hpFrac, baseRate, statusBonuses[ status ], ballBonuses[ ball ], toProperCase(ball) );
                }

                ballProbs.push( ballObj );
            } );

            console.log(ballProbs);

            callback( ballProbs );
        });

    };

    var calcLevelBall = function( hpFrac, baseRate, statusBonus, wildLevel, yourLevel ) {
        var multipliers = [ 1, 2, 4, 8 ];
        var notes = [ 'Your level \u2264 target level',
            'Target level \x3C your level \u2264 2 \xD7 target level',
            '2 \xD7 target level \x3C your level \u2264 4 \xD7 target level',
            '4 \xD7 target level \x3C your level' ];
        var ballObj = {
            name: 'Level Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( !isNaN( wildLevel ) && !isNaN( yourLevel )) {
            if( yourLevel <= wildLevel ) {
                ballObj.cases[0].isActive = true;
            } else if( yourLevel <= 2 * wildLevel ) {
                ballObj.cases[1].isActive = true;
            } else if( yourLevel <= 4 * wildLevel ) {
                ballObj.cases[2].isActive = true;
            } else {
                ballObj.cases[3].isActive = true;
            }
        }

        return ballObj;
    };

    var calcLureBall = function( hpFrac, baseRate, statusBonus, terrain ) {
        var multipliers = [ 3, 1 ];
        var notes = [ 'Fishing', 'Otherwise' ];
        var ballObj = {
            name: 'Lure Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( terrain === 'fishing' ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcLoveBall = function( hpFrac, baseRate, statusBonus, oppSex ) {
        var multipliers = [ 8, 1 ];
        var notes = [ 'Target is same species and opposite gender', 'Otherwise' ];
        var ballObj = {
            name: 'Love Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( oppSex ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcHeavyBall = function( hpFrac, baseRate, statusBonus, weight ) {
        var modifiers = [ -20, 20, 30, 40 ];
        var notes = [ 'Target weight \u2264 204.8 kg',
            '204.8 kg \x3C target weight \u2264 307.2 kg',
            '307.2 kg \x3C target weight \u2264 409.6 kg',
            '409.6 kg \x3C target weight' ];
        var ballObj = {
            name: 'Heavy Ball',
            cases: []
        };
        var modRates = modifiers.map( function( add ) {
            return modifiedCatchRate( hpFrac, baseRate + add, statusBonus, 1 );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        console.log( weight );

        if( weight <= 204.8 ) {
            ballObj.cases[0].isActive = true;
        } else if( weight <= 307.2 ) {
            ballObj.cases[1].isActive = true;
        } else if( weight <= 409.6 ) {
            ballObj.cases[2].isActive = true;
        } else {
            ballObj.cases[3].isActive = true;
        }

        return ballObj;
    };

    var calcFastBall = function( hpFrac, baseRate, statusBonus, speed ) {
        var multipliers = [ 4, 1 ];
        var notes = [ 'Target base speed \x3E 100', 'Otherwise' ];
        var ballObj = {
            name: 'Fast Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( speed >= 100 ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcNetBall = function( hpFrac, baseRate, statusBonus, types ) {
        var multipliers = [ 3, 1 ];
        var notes = [ 'Target is Water or Bug type', 'Otherwise' ];
        var ballObj = {
            name: 'Net Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( types.indexOf( 'bug' ) !== -1 || types.indexOf( 'water' ) !== -1 ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcNestBall = function( hpFrac, baseRate, statusBonus, level ) {
        var mult = Math.max(( 40 - level ) / 10, 1);
        var modRate = modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        var shakeProb = shakeCheck( modRate );
        var ballObj = {
            name: 'Nest Ball',
            shakes: calculateShakeArray( shakeProb ),
            notes: 'Better against lower-level targets. Worst at level 30+'
        };
        return ballObj;
    };

    var calcRepeatBall = function( hpFrac, baseRate, statusBonus, inDex ) {
        var multipliers = [ 3, 1 ];
        var notes = [ 'Target has been caught previously', 'Otherwise' ];
        var ballObj = {
            name: 'Repeat Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( inDex ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcTimerBall = function( hpFrac, baseRate, statusBonus, battleTurn ) {
        var mult = Math.min(( battleTurn + 10 ) / 10, 4);
        var modRate = modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        var shakeProb = shakeCheck( modRate );
        var ballObj = {
            name: 'Timer Ball',
            shakes: calculateShakeArray( shakeProb ),
            notes: 'Better in later turns. Caps at turn 30'
        };
        return ballObj;
    };

    var calcDiveBall = function( hpFrac, baseRate, statusBonus, terrain ) {
        var multipliers = [ 3.5, 1 ];
        var notes = [ 'Currently fishing or surfing', 'Otherwise' ];
        var ballObj = {
            name: 'Dive Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( terrain === 'fishing' || terrain === 'surfing' ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcDuskBall = function( hpFrac, baseRate, statusBonus, nightOrCave ) {
        var multipliers = [ 3.5, 1 ];
        var notes = [ 'Currently nighttime or inside a cave', 'Otherwise' ];
        var ballObj = {
            name: 'Dusk Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( nightOrCave ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcQuickBall = function( hpFrac, baseRate, statusBonus, battleTurn ) {
        var multipliers = [ 4, 1 ];
        var notes = [ 'First turn of battle', 'Otherwise' ];
        var ballObj = {
            name: 'Quick Ball',
            cases: []
        };
        var modRates = multipliers.map( function( mult ) {
            return modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        } );
        var shakeProbs = modRates.map( shakeCheck );
        for( var i = 0; i < shakeProbs.length; i++ ) {
            ballObj.cases.push({
                shakes: calculateShakeArray( shakeProbs[i] ),
                notes: notes[i],
                isActive: false
            });
        }

        if( battleTurn === 1 ) {
            ballObj.cases[0].isActive = true;
        } else {
            ballObj.cases[1].isActive = true;
        }

        return ballObj;
    };

    var calcMoonBall = function( hpFrac, baseRate, statusBonus, name ) {
        var moonPokes = [ 'Nidoran♀', 'Nidorina', 'Nidoqueen',
            'Nidoran♂', 'Nidorino', 'Nidoking',
            'Cleffa', 'Clefairy', 'Clefable',
            'Igglybuff', 'Jigglypuff', 'Wigglytuff',
            'Skitty', 'Delcatty' ];

        var mult = 1;

        if( moonPokes.indexOf( name ) !== -1 ) {
            mult = 4;
        }

        var modRate = modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        var shakeProb = shakeCheck( modRate );
        var ballObj = {
            name: 'Moon Ball',
            shakes: calculateShakeArray( shakeProb ),
            notes: ''
        };
        return ballObj;
    };

    var calcNormalBall = function( hpFrac, baseRate, statusBonus, mult, name ) {
        var modRate = modifiedCatchRate( hpFrac, baseRate, statusBonus, mult );
        var shakeProb = shakeCheck( modRate );
        var shakeArray = calculateShakeArray( shakeProb );
        var ballObj = {
            name: name,
            shakes: shakeArray
        };
        return ballObj;
    };

    var modifiedCatchRate = function( hpFrac, rate, statusMultiplier, ballMultiplier ) {
        rate = Math.max( rate, 1 );
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
        res.send({
            ballProbs: r,
            wildPoke: req.body.wildPoke
        });
    });

});

module.exports = router;
