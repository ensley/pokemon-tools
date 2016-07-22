var express = require('express');
var router = express.Router();

/* GET pokemon listing. */
router.get('/', function(req, res, next) {
  res.send('pokemon page woo');
});

router.get('/:pokemon_identifier', function(req, res, next) {
    var db = res.locals.db;
    var pokeIdentifier = req.params.pokemon_identifier;
    var pokeQueries = res.locals.pq;
    var query = pokeQueries.getMoveset(pokeIdentifier);
    console.log(query);
    var pokeInfo = [];
    db.all(query.text,
    {
        $1: query.values[0]
    },
    function(err, rows) {
        var name = rows[0].pokemon_name;
        console.log(rows);
        rows.map(function(row) {
            Object.keys(row).forEach(function(key, index) {
                if (row[key] === null) {
                    row[key] = '\u2014';
                }
            });
        });
        // res.send('pokemon ' + req.params.pokemon_id + '\n' + row.toString());
        res.render('pokemoninfo', { pokeName: name, pokeMoves: rows });
    });
});

module.exports = router;
