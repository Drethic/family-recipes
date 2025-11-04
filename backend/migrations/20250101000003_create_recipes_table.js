/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable('recipes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.integer('prep_time').notNullable(); // in minutes
    table.integer('cook_time').notNullable(); // in minutes
    table.integer('servings').notNullable();
    table.enum('difficulty', ['easy', 'medium', 'hard']).notNullable().defaultTo('medium');
    table.boolean('is_private').notNullable().defaultTo(false);
    table.enum('status', ['draft', 'pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('approved_by_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    table.index('author_id');
    table.index('status');
    table.index('is_private');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTableIfExists('recipes');
};
