import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

export const mockUser = async (overrides: Record<string, unknown> = {}) => {
  const password = overrides.password || 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    role: 'member',
    is_approved: true,
    password_hash: passwordHash,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
    // Don't override password_hash if explicitly provided
    password_hash: overrides.password_hash || passwordHash,
  };
};

export const mockRecipe = (authorId: string, overrides: Record<string, unknown> = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  author_id: authorId,
  status: 'pending',
  difficulty: 'medium',
  prep_time_minutes: faker.number.int({ min: 10, max: 60 }),
  cook_time_minutes: faker.number.int({ min: 15, max: 120 }),
  servings: faker.number.int({ min: 2, max: 8 }),
  is_private: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockCategory = (overrides: Record<string, unknown> = {}) => ({
  id: faker.string.uuid(),
  name: faker.lorem.word(),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockIngredient = (recipeId: string, orderIndex: number, overrides: Record<string, unknown> = {}) => ({
  id: faker.string.uuid(),
  recipe_id: recipeId,
  name: faker.lorem.word(),
  quantity: faker.number.int({ min: 1, max: 10 }).toString(),
  unit: faker.helpers.arrayElement(['cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg']),
  order_index: orderIndex,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockInstruction = (recipeId: string, stepNumber: number, overrides: Record<string, unknown> = {}) => ({
  id: faker.string.uuid(),
  recipe_id: recipeId,
  step_number: stepNumber,
  instruction: faker.lorem.sentence(),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});
