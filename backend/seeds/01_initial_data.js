const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing data (in reverse order of dependencies)
  await knex('recipe_images').del();
  await knex('recipe_categories').del();
  await knex('instructions').del();
  await knex('ingredients').del();
  await knex('recipes').del();
  await knex('categories').del();
  await knex('users').del();

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  // Insert users
  const [admin, member] = await knex('users')
    .insert([
      {
        email: 'admin@recipes.com',
        password_hash: adminPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_approved: true,
        approved_at: knex.fn.now(),
      },
      {
        email: 'member@recipes.com',
        password_hash: memberPassword,
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
        is_approved: true,
        approved_at: knex.fn.now(),
      },
    ])
    .returning('*');

  // Insert categories
  const categories = await knex('categories')
    .insert([
      { name: 'Breakfast', slug: 'breakfast' },
      { name: 'Lunch', slug: 'lunch' },
      { name: 'Dinner', slug: 'dinner' },
      { name: 'Dessert', slug: 'dessert' },
      { name: 'Appetizer', slug: 'appetizer' },
      { name: 'Soup', slug: 'soup' },
      { name: 'Salad', slug: 'salad' },
      { name: 'Vegetarian', slug: 'vegetarian' },
      { name: 'Vegan', slug: 'vegan' },
      { name: 'Gluten-Free', slug: 'gluten-free' },
    ])
    .returning('*');

  // Insert sample recipe
  const [recipe] = await knex('recipes')
    .insert([
      {
        title: 'Classic Chocolate Chip Cookies',
        description: 'Delicious homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
        prep_time: 15,
        cook_time: 12,
        servings: 24,
        difficulty: 'easy',
        is_private: false,
        status: 'approved',
        author_id: admin.id,
        approved_by_id: admin.id,
      },
    ])
    .returning('*');

  // Insert ingredients for the recipe
  await knex('ingredients').insert([
    { recipe_id: recipe.id, quantity: '2 1/4', unit: 'cups', name: 'all-purpose flour', order_index: 1 },
    { recipe_id: recipe.id, quantity: '1', unit: 'tsp', name: 'baking soda', order_index: 2 },
    { recipe_id: recipe.id, quantity: '1', unit: 'tsp', name: 'salt', order_index: 3 },
    { recipe_id: recipe.id, quantity: '1', unit: 'cup', name: 'butter, softened', order_index: 4 },
    { recipe_id: recipe.id, quantity: '3/4', unit: 'cup', name: 'granulated sugar', order_index: 5 },
    { recipe_id: recipe.id, quantity: '3/4', unit: 'cup', name: 'brown sugar', order_index: 6 },
    { recipe_id: recipe.id, quantity: '2', unit: 'large', name: 'eggs', order_index: 7 },
    { recipe_id: recipe.id, quantity: '2', unit: 'tsp', name: 'vanilla extract', order_index: 8 },
    { recipe_id: recipe.id, quantity: '2', unit: 'cups', name: 'chocolate chips', order_index: 9 },
  ]);

  // Insert instructions for the recipe
  await knex('instructions').insert([
    {
      recipe_id: recipe.id,
      step_number: 1,
      description: 'Preheat oven to 375°F (190°C).',
    },
    {
      recipe_id: recipe.id,
      step_number: 2,
      description: 'In a small bowl, combine flour, baking soda, and salt. Set aside.',
    },
    {
      recipe_id: recipe.id,
      step_number: 3,
      description: 'In a large bowl, beat butter, granulated sugar, and brown sugar until creamy.',
    },
    {
      recipe_id: recipe.id,
      step_number: 4,
      description: 'Add eggs and vanilla extract to the butter mixture and beat well.',
    },
    {
      recipe_id: recipe.id,
      step_number: 5,
      description: 'Gradually stir in the flour mixture.',
    },
    {
      recipe_id: recipe.id,
      step_number: 6,
      description: 'Fold in chocolate chips.',
    },
    {
      recipe_id: recipe.id,
      step_number: 7,
      description: 'Drop rounded tablespoons of dough onto ungreased cookie sheets.',
    },
    {
      recipe_id: recipe.id,
      step_number: 8,
      description: 'Bake for 9-11 minutes or until golden brown.',
    },
    {
      recipe_id: recipe.id,
      step_number: 9,
      description: 'Cool on baking sheet for 2 minutes, then remove to a wire rack.',
    },
  ]);

  // Link recipe to categories
  await knex('recipe_categories').insert([
    { recipe_id: recipe.id, category_id: categories.find((c) => c.slug === 'dessert').id },
  ]);
};
