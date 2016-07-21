var express = require('express');
var router = express.Router();

/* GET pokemon listing. */
router.get('/', function(req, res, next) {
  res.send('pokemon page woo');
});

router.get('/:pokemon_id', function(req, res, next) {
    res.send('pokemon ' + req.params.pokemon_id);
});

module.exports = router;
