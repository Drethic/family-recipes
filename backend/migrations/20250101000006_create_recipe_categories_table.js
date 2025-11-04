/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('recipe_categories', (table) => {
    table.uuid('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');

    table.primary(['recipe_id', 'category_id']);
    table.index('recipe_id');
    table.index('category_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTableIfExists('recipe_categories');
};
