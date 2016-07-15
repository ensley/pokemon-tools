var express = require('express');
var router = express.Router();

/* GET Pokemon page. */
router.get('/', function(req, res) {
    var db = req.db;
    db.all('SELECT * FROM pokemon', function(err, rows) {
        res.render('pokesimple', {
            'pokelist' : rows
        });
    });
});

module.exports = router;
