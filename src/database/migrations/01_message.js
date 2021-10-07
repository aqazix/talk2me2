exports.up = function(knex) {
    return knex.schema.createTable("message", function(table) {
        table.increments("id");
        table.string("message");
        table.integer("id_from").unsigned().references("id").inTable("user");
        table.datetime("date").defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable("message");
}