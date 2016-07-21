var express = require('express');
var squel = require('squel');

 // var q1 = 'SELECT p.identifier, pm.level, mn.name, t.identifier, m.power, m.accuracy, m.pp FROM pokemon_moves AS pm LEFT JOIN pokemon AS p ON pm.pokemon_id = p.id LEFT JOIN move_names AS mn ON pm.move_id = mn.move_id LEFT JOIN moves AS m ON mn.move_id = m.id LEFT JOIN types AS t ON m.type_id = t.id WHERE mn.local_language_id = 9 AND pm.version_group_id = 7 AND pm.pokemon_move_method_id = 1 AND p.identifier = "onix" ORDER BY p.id, pm.level';

var pokeQueries = {
    'getAllPokemon': function() {
        return squel.select()
            .field("name")
            .from("pokemon_species_names", "psn")
            .join("pokemon", "p", "psn.pokemon_species_id = p.species_id")
            .where("psn.local_language_id = 9")
            .toString();
    },

    'getCaptureStats': function(pokeName) {
        return squel.select({ numberedParameters: true })
            .field("psn.name")
            .field("pspec.capture_rate")
            .field("pstat.base_stat", "base_hp")
            .from("pokemon_stats", "pstat")
            .left_join("pokemon_species", "pspec", "pstat.pokemon_id = pspec.id")
            .join("pokemon_species_names", "psn", "psn.pokemon_species_id = pspec.id")
            .where("psn.local_language_id = 9")
            .where("pstat.stat_id = 1")
            .where("psn.name = ?", pokeName)
            .toParam();
    }
};

module.exports = pokeQueries;
