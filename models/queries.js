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
            .field("pspec.evolution_chain_id")
            .field("p.height")
            .field("p.weight")
            .field("pspec.capture_rate")
            .field(
                squel.select()
                    .field("base_stat")
                    .from("pokemon_stats", "pstat")
                    .where("stat_id = 1")
                    .where("pokemon_id = psn.pokemon_species_id"),
                "base_hp"
            )
            .field(
                squel.select()
                    .field("base_stat")
                    .from("pokemon_stats", "pstat")
                    .where("stat_id = 6")
                    .where("pokemon_id = psn.pokemon_species_id"),
                "base_speed"
            )
            .from("pokemon_species", "pspec")
            .join("pokemon_species_names", "psn", "psn.pokemon_species_id = pspec.id")
            .join("pokemon", "p", "pspec.id = p.id")
            .where("psn.local_language_id = 9")
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
    },

    // NOTE ailment IDs 0 through 5 are the only ones that affect capture rates.
    'getAllAilments': function() {
        return squel.select()
            .field("name")
            .from("move_meta_ailment_names", "mman")
            .where("local_language_id = 9")
            .where("move_meta_ailment_id >= 0")
            .where("move_meta_ailment_id <= 5")
            .toString();
    },

    'getBalls': function() {
        return squel.select()
            .field("item_id", "id")
            .field("identifier")
            .field("inames.name", "ball_name")
            .field("icp.name", "category")
            .from("item_names", "inames")
            .left_join("items", "i", "inames.item_id = i.id")
            .left_join("item_category_prose", "icp", "icp.item_category_id = i.category_id")
            .where("i.category_id IN (33, 34, 39)")
            .where("inames.local_language_id = 9")
            .order("category", false)
            .toString();
    }
};

module.exports = pokeQueries;
