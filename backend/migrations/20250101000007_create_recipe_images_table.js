/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('recipe_images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.string('url', 500).notNullable();
    table.string('alt_text', 255).notNullable();
    table.boolean('is_primary').notNullable().defaultTo(false);
    table.integer('order_index').notNullable().defaultTo(0);

    table.index('recipe_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTableIfExists('recipe_images');
};
