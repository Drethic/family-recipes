import { describe, it, expect, beforeEach } from 'vitest';
import { Request } from 'express';
import { validationResult } from 'express-validator';
import { createRecipeValidator, updateRecipeValidator } from '../recipeValidators';

describe('Recipe Validators', () => {
  let mockReq: Partial<Request>;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
  });

  const getValidRecipeData = () => ({
    title: 'Test Recipe',
    description: 'Test description',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'easy',
    isPrivate: false,
    ingredients: [
      { quantity: '1', unit: 'cup', name: 'sugar', order_index: 0 },
    ],
    instructions: [
      { step_number: 1, description: 'Mix ingredients' },
    ],
  });

  describe('createRecipeValidator', () => {
    describe('title validation', () => {
      it('should pass for valid title', async () => {
        mockReq.body = getValidRecipeData();

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const titleErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'title');
        expect(titleErrors).toHaveLength(0);
      });

      it('should fail for empty title', async () => {
        mockReq.body = { ...getValidRecipeData(), title: '' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for missing title', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).title;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for title exceeding 255 characters', async () => {
        mockReq.body = { ...getValidRecipeData(), title: 'A'.repeat(256) };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const titleErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'title');
        expect(titleErrors.length).toBeGreaterThan(0);
      });

      it('should pass for title with exactly 255 characters', async () => {
        mockReq.body = { ...getValidRecipeData(), title: 'A'.repeat(255) };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const titleErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'title');
        expect(titleErrors).toHaveLength(0);
      });

      it('should trim title', async () => {
        mockReq.body = { ...getValidRecipeData(), title: '  Test Recipe  ' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.title).toBe('Test Recipe');
      });
    });

    describe('description validation', () => {
      it('should pass for valid description', async () => {
        mockReq.body = getValidRecipeData();

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const descErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'description');
        expect(descErrors).toHaveLength(0);
      });

      it('should fail for empty description', async () => {
        mockReq.body = { ...getValidRecipeData(), description: '' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for missing description', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).description;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should trim description', async () => {
        mockReq.body = { ...getValidRecipeData(), description: '  Test desc  ' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.description).toBe('Test desc');
      });

      it('should accept long description', async () => {
        mockReq.body = { ...getValidRecipeData(), description: 'A'.repeat(1000) };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const descErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'description');
        expect(descErrors).toHaveLength(0);
      });
    });

    describe('prepTime validation', () => {
      it('should pass for valid prepTime', async () => {
        mockReq.body = { ...getValidRecipeData(), prepTime: 10 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const prepErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'prepTime');
        expect(prepErrors).toHaveLength(0);
      });

      it('should pass for prepTime of 0', async () => {
        mockReq.body = { ...getValidRecipeData(), prepTime: 0 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const prepErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'prepTime');
        expect(prepErrors).toHaveLength(0);
      });

      it('should fail for negative prepTime', async () => {
        mockReq.body = { ...getValidRecipeData(), prepTime: -1 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const prepErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'prepTime');
        expect(prepErrors.length).toBeGreaterThan(0);
      });

      it('should fail for non-integer prepTime', async () => {
        mockReq.body = { ...getValidRecipeData(), prepTime: 10.5 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const prepErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'prepTime');
        expect(prepErrors.length).toBeGreaterThan(0);
      });

      it('should fail for string prepTime', async () => {
        mockReq.body = { ...getValidRecipeData(), prepTime: 'ten' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for missing prepTime', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).prepTime;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('cookTime validation', () => {
      it('should pass for valid cookTime', async () => {
        mockReq.body = { ...getValidRecipeData(), cookTime: 20 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const cookErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'cookTime');
        expect(cookErrors).toHaveLength(0);
      });

      it('should pass for cookTime of 0', async () => {
        mockReq.body = { ...getValidRecipeData(), cookTime: 0 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const cookErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'cookTime');
        expect(cookErrors).toHaveLength(0);
      });

      it('should fail for negative cookTime', async () => {
        mockReq.body = { ...getValidRecipeData(), cookTime: -1 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const cookErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'cookTime');
        expect(cookErrors.length).toBeGreaterThan(0);
      });

      it('should fail for non-integer cookTime', async () => {
        mockReq.body = { ...getValidRecipeData(), cookTime: 20.5 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const cookErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'cookTime');
        expect(cookErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing cookTime', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).cookTime;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('servings validation', () => {
      it('should pass for valid servings', async () => {
        mockReq.body = { ...getValidRecipeData(), servings: 4 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const servingsErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'servings');
        expect(servingsErrors).toHaveLength(0);
      });

      it('should pass for servings of 1', async () => {
        mockReq.body = { ...getValidRecipeData(), servings: 1 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const servingsErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'servings');
        expect(servingsErrors).toHaveLength(0);
      });

      it('should fail for servings of 0', async () => {
        mockReq.body = { ...getValidRecipeData(), servings: 0 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const servingsErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'servings');
        expect(servingsErrors.length).toBeGreaterThan(0);
      });

      it('should fail for negative servings', async () => {
        mockReq.body = { ...getValidRecipeData(), servings: -1 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for non-integer servings', async () => {
        mockReq.body = { ...getValidRecipeData(), servings: 4.5 };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for missing servings', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).servings;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('difficulty validation', () => {
      it('should pass for difficulty "easy"', async () => {
        mockReq.body = { ...getValidRecipeData(), difficulty: 'easy' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors).toHaveLength(0);
      });

      it('should pass for difficulty "medium"', async () => {
        mockReq.body = { ...getValidRecipeData(), difficulty: 'medium' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors).toHaveLength(0);
      });

      it('should pass for difficulty "hard"', async () => {
        mockReq.body = { ...getValidRecipeData(), difficulty: 'hard' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors).toHaveLength(0);
      });

      it('should fail for invalid difficulty', async () => {
        mockReq.body = { ...getValidRecipeData(), difficulty: 'impossible' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing difficulty', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).difficulty;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('isPrivate validation', () => {
      it('should pass for isPrivate true', async () => {
        mockReq.body = { ...getValidRecipeData(), isPrivate: true };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const privateErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'isPrivate');
        expect(privateErrors).toHaveLength(0);
      });

      it('should pass for isPrivate false', async () => {
        mockReq.body = { ...getValidRecipeData(), isPrivate: false };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const privateErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'isPrivate');
        expect(privateErrors).toHaveLength(0);
      });

      it('should pass for missing isPrivate (optional)', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).isPrivate;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const privateErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'isPrivate');
        expect(privateErrors).toHaveLength(0);
      });

      it('should fail for non-boolean isPrivate', async () => {
        mockReq.body = { ...getValidRecipeData(), isPrivate: 'yes' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const privateErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'isPrivate');
        expect(privateErrors.length).toBeGreaterThan(0);
      });
    });

    describe('ingredients validation', () => {
      it('should pass for valid ingredients array', async () => {
        mockReq.body = getValidRecipeData();

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const ingErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'ingredients');
        expect(ingErrors).toHaveLength(0);
      });

      it('should fail for empty ingredients array', async () => {
        mockReq.body = { ...getValidRecipeData(), ingredients: [] };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const ingErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'ingredients');
        expect(ingErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing ingredients', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).ingredients;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for non-array ingredients', async () => {
        mockReq.body = { ...getValidRecipeData(), ingredients: 'not an array' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should pass for multiple ingredients', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          ingredients: [
            { quantity: '1', unit: 'cup', name: 'sugar', order_index: 0 },
            { quantity: '2', unit: 'tsp', name: 'salt', order_index: 1 },
          ],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const ingErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'ingredients');
        expect(ingErrors).toHaveLength(0);
      });

      it('should fail for ingredient with empty quantity', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          ingredients: [{ quantity: '', unit: 'cup', name: 'sugar', order_index: 0 }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for ingredient with empty unit', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          ingredients: [{ quantity: '1', unit: '', name: 'sugar', order_index: 0 }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for ingredient with empty name', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          ingredients: [{ quantity: '1', unit: 'cup', name: '', order_index: 0 }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for ingredient with negative order_index', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          ingredients: [{ quantity: '1', unit: 'cup', name: 'sugar', order_index: -1 }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should pass for ingredient with order_index 0', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          ingredients: [{ quantity: '1', unit: 'cup', name: 'sugar', order_index: 0 }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const ingOrderErrors = errors.array().filter((e) => e.type === 'field' && String(e.path).includes('order_index'));
        expect(ingOrderErrors).toHaveLength(0);
      });
    });

    describe('instructions validation', () => {
      it('should pass for valid instructions array', async () => {
        mockReq.body = getValidRecipeData();

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const instErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'instructions');
        expect(instErrors).toHaveLength(0);
      });

      it('should fail for empty instructions array', async () => {
        mockReq.body = { ...getValidRecipeData(), instructions: [] };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const instErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'instructions');
        expect(instErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing instructions', async () => {
        const data = getValidRecipeData();
        delete (data as Partial<typeof data>).instructions;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for non-array instructions', async () => {
        mockReq.body = { ...getValidRecipeData(), instructions: 'not an array' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should pass for multiple instructions', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          instructions: [
            { step_number: 1, description: 'Step one' },
            { step_number: 2, description: 'Step two' },
          ],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const instErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'instructions');
        expect(instErrors).toHaveLength(0);
      });

      it('should fail for instruction with step_number 0', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          instructions: [{ step_number: 0, description: 'Invalid step' }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for instruction with negative step_number', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          instructions: [{ step_number: -1, description: 'Invalid step' }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should pass for instruction with step_number 1', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          instructions: [{ step_number: 1, description: 'Valid step' }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const stepErrors = errors.array().filter((e) => e.type === 'field' && String(e.path).includes('step_number'));
        expect(stepErrors).toHaveLength(0);
      });

      it('should fail for instruction with empty description', async () => {
        mockReq.body = {
          ...getValidRecipeData(),
          instructions: [{ step_number: 1, description: '' }],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('categoryIds validation', () => {
      it('should pass for valid categoryIds array', async () => {
        mockReq.body = { ...getValidRecipeData(), categoryIds: ['cat-1', 'cat-2'] };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const catErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'categoryIds');
        expect(catErrors).toHaveLength(0);
      });

      it('should pass for missing categoryIds (optional)', async () => {
        const data = getValidRecipeData();
        delete (data as Record<string, unknown>).categoryIds;
        mockReq.body = data;

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const catErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'categoryIds');
        expect(catErrors).toHaveLength(0);
      });

      it('should pass for empty categoryIds array', async () => {
        mockReq.body = { ...getValidRecipeData(), categoryIds: [] };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const catErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'categoryIds');
        expect(catErrors).toHaveLength(0);
      });

      it('should fail for non-array categoryIds', async () => {
        mockReq.body = { ...getValidRecipeData(), categoryIds: 'not-array' };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const catErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'categoryIds');
        expect(catErrors.length).toBeGreaterThan(0);
      });
    });

    describe('complete validation', () => {
      it('should pass for completely valid recipe', async () => {
        mockReq.body = getValidRecipeData();

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(true);
      });

      it('should fail for completely invalid recipe', async () => {
        mockReq.body = {
          title: '',
          description: '',
          prepTime: -1,
          cookTime: 'invalid',
          servings: 0,
          difficulty: 'invalid',
          ingredients: [],
          instructions: [],
        };

        for (const validator of createRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
        expect(errors.array().length).toBeGreaterThan(5);
      });
    });
  });

  describe('updateRecipeValidator', () => {
    describe('title validation', () => {
      it('should pass when title not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const titleErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'title');
        expect(titleErrors).toHaveLength(0);
      });

      it('should pass for valid title', async () => {
        mockReq.body = { title: 'Updated Title' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const titleErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'title');
        expect(titleErrors).toHaveLength(0);
      });

      it('should fail for empty title when provided', async () => {
        mockReq.body = { title: '' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for title exceeding 255 characters', async () => {
        mockReq.body = { title: 'A'.repeat(256) };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should trim title', async () => {
        mockReq.body = { title: '  Updated  ' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.title).toBe('Updated');
      });
    });

    describe('description validation', () => {
      it('should pass when description not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const descErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'description');
        expect(descErrors).toHaveLength(0);
      });

      it('should pass for valid description', async () => {
        mockReq.body = { description: 'Updated description' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const descErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'description');
        expect(descErrors).toHaveLength(0);
      });

      it('should fail for empty description when provided', async () => {
        mockReq.body = { description: '' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should trim description', async () => {
        mockReq.body = { description: '  Updated desc  ' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.description).toBe('Updated desc');
      });
    });

    describe('prepTime validation', () => {
      it('should pass when prepTime not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const prepErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'prepTime');
        expect(prepErrors).toHaveLength(0);
      });

      it('should pass for valid prepTime', async () => {
        mockReq.body = { prepTime: 15 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const prepErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'prepTime');
        expect(prepErrors).toHaveLength(0);
      });

      it('should fail for negative prepTime', async () => {
        mockReq.body = { prepTime: -1 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should pass for prepTime 0', async () => {
        mockReq.body = { prepTime: 0 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const prepErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'prepTime');
        expect(prepErrors).toHaveLength(0);
      });
    });

    describe('cookTime validation', () => {
      it('should pass when cookTime not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const cookErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'cookTime');
        expect(cookErrors).toHaveLength(0);
      });

      it('should pass for valid cookTime', async () => {
        mockReq.body = { cookTime: 30 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const cookErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'cookTime');
        expect(cookErrors).toHaveLength(0);
      });

      it('should fail for negative cookTime', async () => {
        mockReq.body = { cookTime: -1 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('servings validation', () => {
      it('should pass when servings not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const servingsErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'servings');
        expect(servingsErrors).toHaveLength(0);
      });

      it('should pass for valid servings', async () => {
        mockReq.body = { servings: 6 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const servingsErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'servings');
        expect(servingsErrors).toHaveLength(0);
      });

      it('should pass for servings 1', async () => {
        mockReq.body = { servings: 1 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const servingsErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'servings');
        expect(servingsErrors).toHaveLength(0);
      });

      it('should fail for servings 0', async () => {
        mockReq.body = { servings: 0 };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('difficulty validation', () => {
      it('should pass when difficulty not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors).toHaveLength(0);
      });

      it('should pass for difficulty "easy"', async () => {
        mockReq.body = { difficulty: 'easy' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors).toHaveLength(0);
      });

      it('should pass for difficulty "medium"', async () => {
        mockReq.body = { difficulty: 'medium' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors).toHaveLength(0);
      });

      it('should pass for difficulty "hard"', async () => {
        mockReq.body = { difficulty: 'hard' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const diffErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'difficulty');
        expect(diffErrors).toHaveLength(0);
      });

      it('should fail for invalid difficulty', async () => {
        mockReq.body = { difficulty: 'impossible' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('isPrivate validation', () => {
      it('should pass when isPrivate not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const privateErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'isPrivate');
        expect(privateErrors).toHaveLength(0);
      });

      it('should pass for isPrivate true', async () => {
        mockReq.body = { isPrivate: true };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const privateErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'isPrivate');
        expect(privateErrors).toHaveLength(0);
      });

      it('should pass for isPrivate false', async () => {
        mockReq.body = { isPrivate: false };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const privateErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'isPrivate');
        expect(privateErrors).toHaveLength(0);
      });

      it('should fail for non-boolean isPrivate', async () => {
        mockReq.body = { isPrivate: 'yes' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('ingredients validation', () => {
      it('should pass when ingredients not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const ingErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'ingredients');
        expect(ingErrors).toHaveLength(0);
      });

      it('should pass for valid ingredients array', async () => {
        mockReq.body = {
          ingredients: [{ quantity: '1', unit: 'cup', name: 'flour', order_index: 0 }],
        };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const ingErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'ingredients');
        expect(ingErrors).toHaveLength(0);
      });

      it('should pass for empty ingredients array', async () => {
        mockReq.body = { ingredients: [] };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const ingErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'ingredients');
        expect(ingErrors).toHaveLength(0);
      });

      it('should fail for non-array ingredients', async () => {
        mockReq.body = { ingredients: 'not-array' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('instructions validation', () => {
      it('should pass when instructions not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const instErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'instructions');
        expect(instErrors).toHaveLength(0);
      });

      it('should pass for valid instructions array', async () => {
        mockReq.body = {
          instructions: [{ step_number: 1, description: 'Step one' }],
        };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const instErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'instructions');
        expect(instErrors).toHaveLength(0);
      });

      it('should pass for empty instructions array', async () => {
        mockReq.body = { instructions: [] };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const instErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'instructions');
        expect(instErrors).toHaveLength(0);
      });

      it('should fail for non-array instructions', async () => {
        mockReq.body = { instructions: 'not-array' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('categoryIds validation', () => {
      it('should pass when categoryIds not provided (optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const catErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'categoryIds');
        expect(catErrors).toHaveLength(0);
      });

      it('should pass for valid categoryIds array', async () => {
        mockReq.body = { categoryIds: ['cat-1', 'cat-2'] };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const catErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'categoryIds');
        expect(catErrors).toHaveLength(0);
      });

      it('should pass for empty categoryIds array', async () => {
        mockReq.body = { categoryIds: [] };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const catErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'categoryIds');
        expect(catErrors).toHaveLength(0);
      });

      it('should fail for non-array categoryIds', async () => {
        mockReq.body = { categoryIds: 'not-array' };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('complete validation', () => {
      it('should pass for empty body (all optional)', async () => {
        mockReq.body = {};

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(true);
      });

      it('should pass for partial update', async () => {
        mockReq.body = {
          title: 'Updated Title',
          prepTime: 15,
        };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(true);
      });

      it('should fail for invalid partial update', async () => {
        mockReq.body = {
          title: '',
          servings: 0,
          difficulty: 'invalid',
        };

        for (const validator of updateRecipeValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
        expect(errors.array().length).toBeGreaterThan(2);
      });
    });
  });
});
