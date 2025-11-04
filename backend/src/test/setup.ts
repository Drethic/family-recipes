import { beforeAll, afterAll } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/recipes_test';

// Increase timeout for database operations
beforeAll(() => {
  // Any global setup can go here
}, 30000);

afterAll(() => {
  // Any global teardown can go here
});
