/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('ingredients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.string('quantity', 50).notNullable();
    table.string('unit', 50).notNullable();
    table.string('name', 255).notNullable();
    table.integer('order_index').notNullable();

    table.index('recipe_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTableIfExists('ingredients');
};
