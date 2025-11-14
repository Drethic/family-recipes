/**
 * Migration to add instruction_id to recipe_images table
 * This allows images to be associated with either:
 * - Final product (instruction_id IS NULL) - up to 3 images for carousel
 * - Specific instruction step (instruction_id IS NOT NULL) - one image per step
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.alterTable('recipe_images', (table) => {
    // Add nullable instruction_id column
    table.uuid('instruction_id')
      .nullable()
      .references('id')
      .inTable('instructions')
      .onDelete('CASCADE');

    // Add index for better query performance
    table.index('instruction_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.alterTable('recipe_images', (table) => {
    table.dropIndex('instruction_id');
    table.dropColumn('instruction_id');
  });
};
