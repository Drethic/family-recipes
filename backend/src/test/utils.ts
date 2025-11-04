import jwt from 'jsonwebtoken';
import { Knex } from 'knex';
import { mockUser, mockRecipe, mockCategory } from './factories';

export const generateTestToken = (userId: string, role: string = 'member'): string => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const createAuthHeader = (userId: string, role: string = 'member'): string => {
  const token = generateTestToken(userId, role);
  return `Bearer ${token}`;
};

export const createTestUser = async (db: Knex, overrides: Record<string, unknown> = {}) => {
  const user = await mockUser(overrides);
  const [insertedUser] = await db('users').insert(user).returning('*');
  return insertedUser;
};

export const createTestRecipe = async (db: Knex, authorId: string, overrides: Record<string, unknown> = {}) => {
  const recipe = mockRecipe(authorId, overrides);
  const [insertedRecipe] = await db('recipes').insert(recipe).returning('*');
  return insertedRecipe;
};

export const createTestCategory = async (db: Knex, overrides: Record<string, unknown> = {}) => {
  const category = mockCategory(overrides);
  const [insertedCategory] = await db('categories').insert(category).returning('*');
  return insertedCategory;
};
