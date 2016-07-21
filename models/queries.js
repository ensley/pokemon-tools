var express = require('express');
var squel = require('squel');

var pokeQueries = {
    'getNameByIdentifier': function(identifier) {
        return squel.select()
            .field("psn.name")
            .from("pokemon_species_names", "psn")
            .left_join("pokemon", "p", "psn.pokemon_species_id = p.species_id")
            .where("psn.local_language_id = 9")
            .where("p.identifier = ?", identifier)
            .toParam();
    },

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
    },

    // NOTE game version is hardcoded for now. pm.version_group_id = 7 corresponds to FireRed/LeafGreen
    // NOTE pm.pokemon_move_method_id = 1 corresponsds to moves learned by leveling up. hardcoded for now
    'getMoveset': function(pokeName) {
        return squel.select({ numberedParameters: true })
            .field("psn.name", "pokemon_name")
            .field("pm.level")
            .field("mn.name", "move_name")
            .field("t.identifier")
            .field("m.power")
            .field("m.accuracy")
            .field("m.pp")
            .from("pokemon_moves", "pm")
            .left_join("pokemon", "p", "pm.pokemon_id = p.id")
            .left_join("move_names", "mn", "pm.move_id = mn.move_id")
            .left_join("moves", "m", "mn.move_id = m.id")
            .left_join("types", "t", "m.type_id = t.id")
            .left_join("pokemon_species_names", "psn", "p.species_id = psn.pokemon_species_id")
            .where("mn.local_language_id = 9")
            .where("psn.local_language_id = 9")
            .where("pm.version_group_id = 7")
            .where("pm.pokemon_move_method_id = 1")
            .where("p.identifier = ?", pokeName)
            .order("p.id")
            .order("pm.level")
            .toParam();
    }
};

 // var q1 = 'SELECT p.identifier, pm.level, mn.name, t.identifier, m.power, m.accuracy, m.pp FROM pokemon_moves AS pm LEFT JOIN pokemon AS p ON pm.pokemon_id = p.id LEFT JOIN move_names AS mn ON pm.move_id = mn.move_id LEFT JOIN moves AS m ON mn.move_id = m.id LEFT JOIN types AS t ON m.type_id = t.id WHERE mn.local_language_id = 9 AND pm.version_group_id = 7 AND pm.pokemon_move_method_id = 1 AND p.identifier = "onix" ORDER BY p.id, pm.level';

module.exports = pokeQueries;
