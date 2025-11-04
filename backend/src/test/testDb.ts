import knex, { Knex } from 'knex';

let testDb: Knex | null = null;

export const setupTestDb = async (): Promise<Knex> => {
  if (testDb) {
    return testDb;
  }

  testDb = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/recipes_test',
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  });

  // Run migrations
  await testDb.migrate.latest();

  return testDb;
};

export const teardownTestDb = async (): Promise<void> => {
  if (testDb) {
    await testDb.migrate.rollback({}, true);
    await testDb.destroy();
    testDb = null;
  }
};

export const clearTestDb = async (): Promise<void> => {
  if (!testDb) {
    return;
  }

  // Delete all records from tables (in correct order to respect foreign keys)
  await testDb('recipe_ingredients').del();
  await testDb('recipe_instructions').del();
  await testDb('recipe_categories').del();
  await testDb('recipes').del();
  await testDb('categories').del();
  await testDb('users').del();
};

export const getTestDb = (): Knex => {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDb() first.');
  }
  return testDb;
};
