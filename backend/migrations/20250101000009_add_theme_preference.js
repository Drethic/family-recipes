/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.table('users', (table) => {
    table.enum('theme_preference', ['light', 'dark', 'system']).notNullable().defaultTo('system');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('theme_preference');
  });
};
