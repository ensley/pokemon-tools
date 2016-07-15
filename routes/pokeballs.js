var express = require('express');
var router = express.Router();

/* GET Pokemon page. */
router.get('/', function(req, res) {
    var db = req.db;
    // db.all('SELECT * FROM pokemon', function(err, rows) {
    //     res.render('pokeballs', {
    //         'pokelist' : rows
    //     });
    // });
    var pokeList = [];
    db.all('SELECT name FROM pokemon_species_names JOIN pokemon ON pokemon_species_names.pokemon_species_id = pokemon.species_id WHERE pokemon_species_names.local_language_id = 9', function(err, rows) {
        rows.map(function(row) {
            pokeList.push(row.name);
        });
        res.render('pokeballs', {
            'pokelist': pokeList
        });
    });
});

module.exports = router;
