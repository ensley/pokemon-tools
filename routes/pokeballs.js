var express = require('express');
var router = express.Router();

function calculateCatchProb(db, wildPokemon, hpRemaining, callback) {
    var rate = 0;
    db.get('SELECT name, capture_rate, base_stat as base_hp FROM pokemon_species_names JOIN (SELECT * FROM pokemon_stats LEFT JOIN pokemon_species ON pokemon_stats.pokemon_id = pokemon_species.id) AS a ON pokemon_species_names.pokemon_species_id = a.id WHERE pokemon_species_names.local_language_id = 9 AND stat_id = 1 AND name = $name',
    {
        $name: wildPokemon
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
    var squel = res.locals.squel;
    var pokeList = [];
    var query = squel.select()
        .field("name")
        .from("pokemon_species_names", "psn")
        .join("pokemon", "p", "psn.pokemon_species_id = p.species_id")
        .where("psn.local_language_id = 9")
        .toString();
    db.all(query, function(err, rows) {
        rows.map(function(row) {
            pokeList.push(row.name);
        });
        res.render('pokeballs', {
            'pokelist': pokeList
        });
    });
});

router.post('/', function(req, res) {
    var wildPokemon = req.body.wildPokemon;
    var hpRemaining = req.body.hpRemaining / 100;
    var wildPokemonLevel = req.body.wildPokemonLevel;
    var db = res.locals.db;

    calculateCatchProb(db, wildPokemon, hpRemaining, function(r) {
        res.send({rate: r});
    });
});

module.exports = router;
