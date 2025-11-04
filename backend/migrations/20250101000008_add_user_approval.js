/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.table('users', (table) => {
    table.boolean('is_approved').notNullable().defaultTo(false);
    table.timestamp('approved_at').nullable();
    table.uuid('approved_by_id').nullable().references('id').inTable('users').onDelete('SET NULL');

    table.index('is_approved');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('is_approved');
    table.dropColumn('approved_at');
    table.dropColumn('approved_by_id');
  });
};
