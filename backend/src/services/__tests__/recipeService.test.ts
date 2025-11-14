import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecipeService } from '../recipeService';
import db from '../../config/database';
import { UserRole, RecipeStatus } from '../../types';

vi.mock('../../config/database');

describe('RecipeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('should return recipes for guests (only approved public)', async () => {
      const mockCount = { count: '2' };
      const mockRecipes = [
        { id: 'recipe-1', title: 'Recipe 1', status: RecipeStatus.APPROVED, is_private: false },
      ];

      const mockCountQuery = {
        where: vi.fn().mockReturnThis(),
        clone: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCount),
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRecipes),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountQuery as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectQuery as never);

      const result = await RecipeService.getAll(undefined, UserRole.GUEST);

      expect(result.recipes).toEqual(mockRecipes);
      expect(result.total).toBe(2);
    });

    it('should return recipes for members (approved + own)', async () => {
      const mockCount = { count: '5' };
      const mockRecipes = [
        { id: 'recipe-1', title: 'Approved Recipe' },
        { id: 'recipe-2', title: 'My Pending Recipe' },
      ];

      const mockCountQuery = {
        where: vi.fn().mockReturnThis(),
        clone: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCount),
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRecipes),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountQuery as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectQuery as never);

      const result = await RecipeService.getAll('user-123', UserRole.MEMBER);

      expect(result.total).toBe(5);
    });

    it('should return all recipes for admins', async () => {
      const mockCount = { count: '10' };
      const mockRecipes = [{ id: 'recipe-1' }];

      const mockCountQuery = {
        clone: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCount),
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRecipes),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountQuery as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectQuery as never);

      const result = await RecipeService.getAll('admin-123', UserRole.ADMIN);

      expect(result.total).toBe(10);
    });

    it('should filter by status for admins', async () => {
      const mockCount = { count: '3' };
      const mockRecipes = [{ id: 'recipe-1', status: RecipeStatus.PENDING }];

      const mockCountQuery = {
        where: vi.fn().mockReturnThis(),
        clone: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCount),
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRecipes),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountQuery as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectQuery as never);

      await RecipeService.getAll('admin-123', UserRole.ADMIN, 1, 20, RecipeStatus.PENDING);

      expect(mockCountQuery.where).toHaveBeenCalledWith('recipes.status', RecipeStatus.PENDING);
    });

    it('should respect pagination parameters', async () => {
      const mockCount = { count: '100' };
      const mockRecipes = [{ id: 'recipe-1' }];

      const mockCountQuery = {
        where: vi.fn().mockReturnThis(),
        clone: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCount),
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRecipes),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountQuery as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectQuery as never);

      await RecipeService.getAll(undefined, UserRole.GUEST, 3, 10);

      expect(mockSelectQuery.limit).toHaveBeenCalledWith(10);
      expect(mockSelectQuery.offset).toHaveBeenCalledWith(20);
    });
  });

  describe('getById', () => {
    it('should return recipe for guest if approved and public', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        status: RecipeStatus.APPROVED,
        is_private: false,
        author_id: 'author-123',
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      const mockIngredientsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      const mockInstructionsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      const mockCategoriesChain = {
        select: vi.fn().mockReturnThis(),
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      const mockImagesChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);
      vi.mocked(db).mockReturnValueOnce(mockIngredientsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInstructionsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockCategoriesChain as never);
      vi.mocked(db).mockReturnValueOnce(mockImagesChain as never);

      const result = await RecipeService.getById('recipe-1', undefined, UserRole.GUEST);

      expect(result).toBeDefined();
      expect(result?.id).toBe('recipe-1');
    });

    it('should return null for guest if recipe is private', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        status: RecipeStatus.APPROVED,
        is_private: true,
        author_id: 'author-123',
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      const result = await RecipeService.getById('recipe-1', undefined, UserRole.GUEST);

      expect(result).toBeNull();
    });

    it('should return null for guest if recipe is pending', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        status: RecipeStatus.PENDING,
        is_private: false,
        author_id: 'author-123',
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      const result = await RecipeService.getById('recipe-1', undefined, UserRole.GUEST);

      expect(result).toBeNull();
    });

    it('should return own recipe for member even if pending', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        status: RecipeStatus.PENDING,
        is_private: false,
        author_id: 'member-123',
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      const mockIngredientsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      const mockInstructionsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      const mockCategoriesChain = {
        select: vi.fn().mockReturnThis(),
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      const mockImagesChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);
      vi.mocked(db).mockReturnValueOnce(mockIngredientsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInstructionsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockCategoriesChain as never);
      vi.mocked(db).mockReturnValueOnce(mockImagesChain as never);

      const result = await RecipeService.getById('recipe-1', 'member-123', UserRole.MEMBER);

      expect(result).toBeDefined();
    });

    it('should return any recipe for admin', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        status: RecipeStatus.PENDING,
        is_private: true,
        author_id: 'other-user',
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      const mockIngredientsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      const mockInstructionsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      const mockCategoriesChain = {
        select: vi.fn().mockReturnThis(),
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      const mockImagesChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);
      vi.mocked(db).mockReturnValueOnce(mockIngredientsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInstructionsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockCategoriesChain as never);
      vi.mocked(db).mockReturnValueOnce(mockImagesChain as never);

      const result = await RecipeService.getById('recipe-1', 'admin-123', UserRole.ADMIN);

      expect(result).toBeDefined();
    });

    it('should return null if recipe does not exist', async () => {
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      const result = await RecipeService.getById('nonexistent', 'user-123', UserRole.MEMBER);

      expect(result).toBeNull();
    });

    it('should include ingredients, instructions, categories, and images', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        status: RecipeStatus.APPROVED,
        is_private: false,
        author_id: 'author-123',
      };

      const mockIngredients = [{ id: 'ing-1', name: 'Sugar' }];
      const mockInstructions = [{ id: 'inst-1', description: 'Mix' }];
      const mockCategories = [{ id: 'cat-1', name: 'Dessert' }];
      const mockImages = [{ id: 'img-1', url: 'image.jpg' }];

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      const mockIngredientsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockIngredients),
      };

      const mockInstructionsChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockInstructions),
      };

      const mockCategoriesChain = {
        select: vi.fn().mockReturnThis(),
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockCategories),
      };

      const mockImagesChain = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockImages),
      };

      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);
      vi.mocked(db).mockReturnValueOnce(mockIngredientsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInstructionsChain as never);
      vi.mocked(db).mockReturnValueOnce(mockCategoriesChain as never);
      vi.mocked(db).mockReturnValueOnce(mockImagesChain as never);

      const result = await RecipeService.getById('recipe-1', 'admin-123', UserRole.ADMIN);

      expect(result?.ingredients).toEqual(mockIngredients);
      expect(result?.instructions).toEqual(mockInstructions);
      expect(result?.categories).toEqual(mockCategories);
      expect(result?.images).toEqual(mockImages);
    });
  });

  describe('create', () => {
    it('should create recipe with pending status for members', async () => {
      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'recipe-1', status: RecipeStatus.PENDING }]),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockInsertChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue({
        id: 'recipe-1',
        status: RecipeStatus.PENDING,
      } as never);

      const recipeData = {
        title: 'New Recipe',
        description: 'Test',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        isPrivate: false,
        ingredients: [{ quantity: '1', unit: 'cup', name: 'sugar', order_index: 0 }],
        instructions: [{ step_number: 1, description: 'Mix' }],
      };

      const result = await RecipeService.create(recipeData, 'member-123', UserRole.MEMBER);

      expect(result.status).toBe(RecipeStatus.PENDING);
    });

    it('should create recipe with approved status for admins', async () => {
      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          { id: 'recipe-1', status: RecipeStatus.APPROVED, approved_by_id: 'admin-123' },
        ]),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockInsertChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue({
        id: 'recipe-1',
        status: RecipeStatus.APPROVED,
      } as never);

      const recipeData = {
        title: 'Admin Recipe',
        description: 'Test',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        isPrivate: false,
        ingredients: [{ quantity: '1', unit: 'cup', name: 'sugar', order_index: 0 }],
        instructions: [{ step_number: 1, description: 'Mix' }],
      };

      const result = await RecipeService.create(recipeData, 'admin-123', UserRole.ADMIN);

      expect(result.status).toBe(RecipeStatus.APPROVED);
    });

    it('should create ingredients for recipe', async () => {
      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'recipe-1' }]),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockInsertChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue({ id: 'recipe-1' } as never);

      const recipeData = {
        title: 'Recipe',
        description: 'Test',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        isPrivate: false,
        ingredients: [
          { quantity: '1', unit: 'cup', name: 'sugar', order_index: 0 },
          { quantity: '2', unit: 'tsp', name: 'salt', order_index: 1 },
        ],
        instructions: [{ step_number: 1, description: 'Mix' }],
      };

      await RecipeService.create(recipeData, 'member-123', UserRole.MEMBER);

      expect(mockInsertChain.insert).toHaveBeenCalled();
    });

    it('should link categories to recipe', async () => {
      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'recipe-1' }]),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockInsertChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue({ id: 'recipe-1' } as never);

      const recipeData = {
        title: 'Recipe',
        description: 'Test',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        isPrivate: false,
        ingredients: [{ quantity: '1', unit: 'cup', name: 'sugar', order_index: 0 }],
        instructions: [{ step_number: 1, description: 'Mix' }],
        categoryIds: ['cat-1', 'cat-2'],
      };

      await RecipeService.create(recipeData, 'member-123', UserRole.MEMBER);

      expect(mockInsertChain.insert).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should allow owner to update their recipe', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'member-123' };

      const mockQueryChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockQueryChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue(mockRecipe as never);

      const result = await RecipeService.update(
        'recipe-1',
        { title: 'Updated Title' },
        'member-123',
        UserRole.MEMBER
      );

      expect(result).toBeDefined();
    });

    it('should allow admin to update any recipe', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'other-user' };

      const mockQueryChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockQueryChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue(mockRecipe as never);

      const result = await RecipeService.update(
        'recipe-1',
        { title: 'Admin Update' },
        'admin-123',
        UserRole.ADMIN
      );

      expect(result).toBeDefined();
    });

    it('should throw error if non-owner member tries to update', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'other-member' };

      const mockQueryChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockQueryChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      await expect(
        RecipeService.update('recipe-1', { title: 'Hack' }, 'member-123', UserRole.MEMBER)
      ).rejects.toThrow('You do not have permission to update this recipe');
    });

    it('should return null if recipe does not exist', async () => {
      const mockQueryChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockQueryChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      const result = await RecipeService.update(
        'nonexistent',
        { title: 'Test' },
        'user-123',
        UserRole.MEMBER
      );

      expect(result).toBeNull();
    });

    it('should update ingredients if provided', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'member-123' };

      const mockQueryChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
        update: vi.fn().mockResolvedValue(1),
        del: vi.fn().mockResolvedValue(1),
        insert: vi.fn().mockReturnThis(),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockQueryChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue(mockRecipe as never);

      await RecipeService.update(
        'recipe-1',
        {
          ingredients: [{ quantity: '2', unit: 'cup', name: 'flour', order_index: 0 }],
        },
        'member-123',
        UserRole.MEMBER
      );

      expect(mockQueryChain.del).toHaveBeenCalled();
      expect(mockQueryChain.insert).toHaveBeenCalled();
    });

    it('should update instructions if provided', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'member-123' };

      const mockQueryChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
        update: vi.fn().mockResolvedValue(1),
        del: vi.fn().mockResolvedValue(1),
        insert: vi.fn().mockReturnThis(),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockQueryChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue(mockRecipe as never);

      await RecipeService.update(
        'recipe-1',
        {
          instructions: [{ step_number: 1, description: 'New step' }],
        },
        'member-123',
        UserRole.MEMBER
      );

      expect(mockQueryChain.del).toHaveBeenCalled();
      expect(mockQueryChain.insert).toHaveBeenCalled();
    });

    it('should update categories if provided', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'member-123' };

      const mockQueryChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
        update: vi.fn().mockResolvedValue(1),
        del: vi.fn().mockResolvedValue(1),
        insert: vi.fn().mockReturnThis(),
      };

      const mockTransaction = vi.fn().mockReturnValue(mockQueryChain);

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTransaction as never);
      });

      vi.spyOn(RecipeService, 'getById').mockResolvedValue(mockRecipe as never);

      await RecipeService.update(
        'recipe-1',
        {
          categoryIds: ['cat-1', 'cat-2'],
        },
        'member-123',
        UserRole.MEMBER
      );

      expect(mockQueryChain.del).toHaveBeenCalled();
      expect(mockQueryChain.insert).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should allow owner to delete their recipe', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'member-123' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        del: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockDeleteChain as never);

      const result = await RecipeService.delete('recipe-1', 'member-123', UserRole.MEMBER);

      expect(result).toBe(true);
    });

    it('should allow admin to delete any recipe', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'other-user' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        del: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockDeleteChain as never);

      const result = await RecipeService.delete('recipe-1', 'admin-123', UserRole.ADMIN);

      expect(result).toBe(true);
    });

    it('should throw error if non-owner member tries to delete', async () => {
      const mockRecipe = { id: 'recipe-1', author_id: 'other-member' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRecipe),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      await expect(
        RecipeService.delete('recipe-1', 'member-123', UserRole.MEMBER)
      ).rejects.toThrow('You do not have permission to delete this recipe');
    });

    it('should return false if recipe does not exist', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      const result = await RecipeService.delete('nonexistent', 'user-123', UserRole.MEMBER);

      expect(result).toBe(false);
    });
  });

  describe('approve', () => {
    it('should approve recipe and set approved_by_id', async () => {
      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValue(mockUpdateChain as never);

      vi.spyOn(RecipeService, 'getById').mockResolvedValue({
        id: 'recipe-1',
        status: RecipeStatus.APPROVED,
        approved_by_id: 'admin-123',
      } as never);

      const result = await RecipeService.approve('recipe-1', 'admin-123');

      expect(result?.status).toBe(RecipeStatus.APPROVED);
      expect(result?.approved_by_id).toBe('admin-123');
    });
  });

  describe('reject', () => {
    it('should reject recipe and set approved_by_id', async () => {
      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValue(mockUpdateChain as never);

      vi.spyOn(RecipeService, 'getById').mockResolvedValue({
        id: 'recipe-1',
        status: RecipeStatus.REJECTED,
        approved_by_id: 'admin-123',
      } as never);

      const result = await RecipeService.reject('recipe-1', 'admin-123');

      expect(result?.status).toBe(RecipeStatus.REJECTED);
      expect(result?.approved_by_id).toBe('admin-123');
    });
  });

  describe('getUserRecipes', () => {
    it('should return all recipes for user', async () => {
      const mockRecipes = [
        { id: 'recipe-1', author_id: 'user-123' },
        { id: 'recipe-2', author_id: 'user-123' },
      ];

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockRecipes),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      vi.spyOn(RecipeService, 'getById').mockResolvedValue({ id: 'recipe-1' } as never);

      const result = await RecipeService.getUserRecipes('user-123');

      expect(result).toHaveLength(2);
    });
  });
});
