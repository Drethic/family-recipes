import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { RecipeController } from '../recipeController';
import { RecipeService } from '../../services/recipeService';
import { AuthRequest, UserRole, RecipeStatus } from '../../types';

vi.mock('../../services/recipeService');

describe('RecipeController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.MEMBER,
      },
    };

    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('getAll', () => {
    it('should return paginated recipes', async () => {
      const mockRecipes = [{ id: 'recipe-1', title: 'Test Recipe' }];

      vi.mocked(RecipeService.getAll).mockResolvedValue({
        recipes: mockRecipes as never,
        total: 10,
      });

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            recipes: mockRecipes,
          }),
        })
      );
    });

    it('should respect page query parameter', async () => {
      mockReq.query = { page: '3' };

      vi.mocked(RecipeService.getAll).mockResolvedValue({
        recipes: [] as never,
        total: 0,
      });

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.getAll).toHaveBeenCalledWith('user-123', UserRole.MEMBER, 3, 20, undefined);
    });

    it('should respect limit query parameter', async () => {
      mockReq.query = { limit: '50' };

      vi.mocked(RecipeService.getAll).mockResolvedValue({
        recipes: [] as never,
        total: 0,
      });

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.getAll).toHaveBeenCalledWith('user-123', UserRole.MEMBER, 1, 50, undefined);
    });

    it('should respect status query parameter', async () => {
      mockReq.query = { status: RecipeStatus.PENDING };

      vi.mocked(RecipeService.getAll).mockResolvedValue({
        recipes: [] as never,
        total: 0,
      });

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.getAll).toHaveBeenCalledWith(
        'user-123',
        UserRole.MEMBER,
        1,
        20,
        RecipeStatus.PENDING
      );
    });

    it('should pass user info to service', async () => {
      vi.mocked(RecipeService.getAll).mockResolvedValue({
        recipes: [] as never,
        total: 0,
      });

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.getAll).toHaveBeenCalledWith(
        'user-123',
        UserRole.MEMBER,
        1,
        20,
        undefined
      );
    });

    it('should handle service errors', async () => {
      vi.mocked(RecipeService.getAll).mockRejectedValue(new Error('Database error'));

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Database error',
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      vi.mocked(RecipeService.getAll).mockResolvedValue({
        recipes: [] as never,
        total: 55,
      });

      mockReq.query = { page: '2', limit: '10' };

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 2,
              limit: 10,
              total: 55,
              totalPages: 6,
            }),
          }),
        })
      );
    });

    it('should handle unknown errors', async () => {
      vi.mocked(RecipeService.getAll).mockRejectedValue('Unknown error');

      await RecipeController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to get recipes',
        })
      );
    });
  });

  describe('getById', () => {
    it('should return recipe by id', async () => {
      const mockRecipe = { id: 'recipe-1', title: 'Test Recipe' };

      vi.mocked(RecipeService.getById).mockResolvedValue(mockRecipe as never);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRecipe,
        })
      );
    });

    it('should return 404 if recipe not found', async () => {
      vi.mocked(RecipeService.getById).mockResolvedValue(null);

      mockReq.params = { id: 'nonexistent' };

      await RecipeController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Recipe not found',
        })
      );
    });

    it('should pass user info to service', async () => {
      vi.mocked(RecipeService.getById).mockResolvedValue({ id: 'recipe-1' } as never);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.getById).toHaveBeenCalledWith('recipe-1', 'user-123', UserRole.MEMBER);
    });

    it('should handle service errors', async () => {
      vi.mocked(RecipeService.getById).mockRejectedValue(new Error('Database error'));

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should handle unknown errors', async () => {
      vi.mocked(RecipeService.getById).mockRejectedValue('Unknown error');

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to get recipe',
        })
      );
    });
  });

  describe('create', () => {
    it('should create recipe successfully', async () => {
      const mockRecipe = { id: 'recipe-1', title: 'New Recipe' };

      vi.mocked(RecipeService.create).mockResolvedValue(mockRecipe as never);

      mockReq.body = {
        title: 'New Recipe',
        description: 'Test',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        ingredients: [],
        instructions: [],
      };

      await RecipeController.create(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRecipe,
          message: 'Recipe created successfully',
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;

      await RecipeController.create(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
        })
      );
    });

    it('should pass user info to service', async () => {
      vi.mocked(RecipeService.create).mockResolvedValue({ id: 'recipe-1' } as never);

      mockReq.body = { title: 'Test' };

      await RecipeController.create(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.create).toHaveBeenCalledWith(mockReq.body, 'user-123', UserRole.MEMBER);
    });

    it('should handle service errors', async () => {
      vi.mocked(RecipeService.create).mockRejectedValue(new Error('Validation error'));

      mockReq.body = { title: 'Test' };

      await RecipeController.create(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation error',
        })
      );
    });

    it('should handle unknown errors', async () => {
      vi.mocked(RecipeService.create).mockRejectedValue('Unknown error');

      mockReq.body = { title: 'Test' };

      await RecipeController.create(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to create recipe',
        })
      );
    });
  });

  describe('update', () => {
    it('should update recipe successfully', async () => {
      const mockRecipe = { id: 'recipe-1', title: 'Updated Recipe' };

      vi.mocked(RecipeService.update).mockResolvedValue(mockRecipe as never);

      mockReq.params = { id: 'recipe-1' };
      mockReq.body = { title: 'Updated Recipe' };

      await RecipeController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRecipe,
          message: 'Recipe updated successfully',
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'recipe-1' };

      await RecipeController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 404 if recipe not found', async () => {
      vi.mocked(RecipeService.update).mockResolvedValue(null);

      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { title: 'Test' };

      await RecipeController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Recipe not found',
        })
      );
    });

    it('should handle permission errors', async () => {
      vi.mocked(RecipeService.update).mockRejectedValue(
        new Error('You do not have permission to update this recipe')
      );

      mockReq.params = { id: 'recipe-1' };
      mockReq.body = { title: 'Test' };

      await RecipeController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should handle validation errors', async () => {
      vi.mocked(RecipeService.update).mockRejectedValue(new Error('Invalid data'));

      mockReq.params = { id: 'recipe-1' };
      mockReq.body = { title: 'Test' };

      await RecipeController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should pass user info to service', async () => {
      vi.mocked(RecipeService.update).mockResolvedValue({ id: 'recipe-1' } as never);

      mockReq.params = { id: 'recipe-1' };
      mockReq.body = { title: 'Test' };

      await RecipeController.update(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.update).toHaveBeenCalledWith('recipe-1', mockReq.body, 'user-123', UserRole.MEMBER);
    });
  });

  describe('delete', () => {
    it('should delete recipe successfully', async () => {
      vi.mocked(RecipeService.delete).mockResolvedValue(true);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'recipe-1' };

      await RecipeController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 404 if recipe not found', async () => {
      vi.mocked(RecipeService.delete).mockResolvedValue(false);

      mockReq.params = { id: 'nonexistent' };

      await RecipeController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Recipe not found',
        })
      );
    });

    it('should handle permission errors', async () => {
      vi.mocked(RecipeService.delete).mockRejectedValue(
        new Error('You do not have permission to delete this recipe')
      );

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should handle service errors', async () => {
      vi.mocked(RecipeService.delete).mockRejectedValue(new Error('Database error'));

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should pass user info to service', async () => {
      vi.mocked(RecipeService.delete).mockResolvedValue(true);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.delete).toHaveBeenCalledWith('recipe-1', 'user-123', UserRole.MEMBER);
    });
  });

  describe('approve', () => {
    it('should approve recipe successfully', async () => {
      const mockRecipe = { id: 'recipe-1', status: RecipeStatus.APPROVED };

      vi.mocked(RecipeService.approve).mockResolvedValue(mockRecipe as never);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.approve(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRecipe,
          message: 'Recipe approved successfully',
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'recipe-1' };

      await RecipeController.approve(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 404 if recipe not found', async () => {
      vi.mocked(RecipeService.approve).mockResolvedValue(null);

      mockReq.params = { id: 'nonexistent' };

      await RecipeController.approve(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle service errors', async () => {
      vi.mocked(RecipeService.approve).mockRejectedValue(new Error('Database error'));

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.approve(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should pass user id to service', async () => {
      vi.mocked(RecipeService.approve).mockResolvedValue({ id: 'recipe-1' } as never);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.approve(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.approve).toHaveBeenCalledWith('recipe-1', 'user-123');
    });
  });

  describe('reject', () => {
    it('should reject recipe successfully', async () => {
      const mockRecipe = { id: 'recipe-1', status: RecipeStatus.REJECTED };

      vi.mocked(RecipeService.reject).mockResolvedValue(mockRecipe as never);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.reject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRecipe,
          message: 'Recipe rejected successfully',
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'recipe-1' };

      await RecipeController.reject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 404 if recipe not found', async () => {
      vi.mocked(RecipeService.reject).mockResolvedValue(null);

      mockReq.params = { id: 'nonexistent' };

      await RecipeController.reject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle service errors', async () => {
      vi.mocked(RecipeService.reject).mockRejectedValue(new Error('Database error'));

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.reject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should pass user id to service', async () => {
      vi.mocked(RecipeService.reject).mockResolvedValue({ id: 'recipe-1' } as never);

      mockReq.params = { id: 'recipe-1' };

      await RecipeController.reject(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.reject).toHaveBeenCalledWith('recipe-1', 'user-123');
    });
  });

  describe('getMyRecipes', () => {
    it('should return user recipes successfully', async () => {
      const mockRecipes = [{ id: 'recipe-1' }, { id: 'recipe-2' }];

      vi.mocked(RecipeService.getUserRecipes).mockResolvedValue(mockRecipes as never);

      await RecipeController.getMyRecipes(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRecipes,
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;

      await RecipeController.getMyRecipes(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should pass user id to service', async () => {
      vi.mocked(RecipeService.getUserRecipes).mockResolvedValue([] as never);

      await RecipeController.getMyRecipes(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.getUserRecipes).toHaveBeenCalledWith('user-123');
    });

    it('should handle service errors', async () => {
      vi.mocked(RecipeService.getUserRecipes).mockRejectedValue(new Error('Database error'));

      await RecipeController.getMyRecipes(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Database error',
        })
      );
    });

    it('should handle unknown errors', async () => {
      vi.mocked(RecipeService.getUserRecipes).mockRejectedValue('Unknown error');

      await RecipeController.getMyRecipes(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to get user recipes',
        })
      );
    });
  });

  describe('uploadImage', () => {
    const mockUploadService = {
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    beforeEach(() => {
      mockReq.file = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;
      mockReq.params = { id: 'recipe-1' };
      mockReq.body = {
        altText: 'Test image',
        isPrimary: 'true',
        orderIndex: '0',
      };
    });

    it('should upload image successfully', async () => {
      const mockImage = {
        id: 'image-1',
        url: 'http://example.com/image.jpg',
        alt_text: 'Test image',
      };

      mockUploadService.uploadImage.mockResolvedValue({
        url: 'http://example.com/image.jpg',
        filename: 'test.jpg',
      });

      vi.mocked(RecipeService.addImage).mockResolvedValue(mockImage as never);

      await RecipeController.uploadImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockImage,
        })
      );
    });

    it('should return 400 if no file provided', async () => {
      mockReq.file = undefined;

      await RecipeController.uploadImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No image file provided',
        })
      );
    });

    it('should handle upload errors', async () => {
      vi.mocked(RecipeService.addImage).mockRejectedValue(new Error('Upload failed'));

      await RecipeController.uploadImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should handle step images with instructionId', async () => {
      mockReq.body.instructionId = 'step-1';

      mockUploadService.uploadImage.mockResolvedValue({
        url: 'http://example.com/image.jpg',
        filename: 'test.jpg',
      });

      vi.mocked(RecipeService.addImage).mockResolvedValue({
        id: 'image-1',
        instruction_id: 'step-1',
      } as never);

      await RecipeController.uploadImage(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.addImage).toHaveBeenCalledWith(
        'recipe-1',
        expect.any(String),
        'Test image',
        true,
        0,
        'step-1',
        'user-123',
        UserRole.MEMBER
      );
    });
  });

  describe('updateImage', () => {
    beforeEach(() => {
      mockReq.params = { imageId: 'image-1' };
      mockReq.body = {
        altText: 'Updated alt text',
        isPrimary: true,
        orderIndex: 1,
      };
    });

    it('should update image successfully', async () => {
      const mockImage = {
        id: 'image-1',
        alt_text: 'Updated alt text',
        is_primary: true,
        order_index: 1,
      };

      vi.mocked(RecipeService.updateImage).mockResolvedValue(mockImage as never);

      await RecipeController.updateImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockImage,
        })
      );
    });

    it('should return 404 if image not found', async () => {
      vi.mocked(RecipeService.updateImage).mockResolvedValue(null);

      await RecipeController.updateImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Image not found',
        })
      );
    });

    it('should handle update errors', async () => {
      vi.mocked(RecipeService.updateImage).mockRejectedValue(new Error('Update failed'));

      await RecipeController.updateImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should pass correct parameters to service', async () => {
      vi.mocked(RecipeService.updateImage).mockResolvedValue({ id: 'image-1' } as never);

      await RecipeController.updateImage(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.updateImage).toHaveBeenCalledWith(
        'image-1',
        {
          altText: 'Updated alt text',
          isPrimary: true,
          orderIndex: 1,
        },
        'user-123',
        UserRole.MEMBER
      );
    });
  });

  describe('deleteImage', () => {
    beforeEach(() => {
      mockReq.params = { imageId: 'image-1' };
    });

    it('should delete image successfully', async () => {
      vi.mocked(RecipeService.deleteImage).mockResolvedValue(undefined);

      await RecipeController.deleteImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Image deleted successfully',
        })
      );
    });

    it('should handle delete errors', async () => {
      vi.mocked(RecipeService.deleteImage).mockRejectedValue(new Error('Delete failed'));

      await RecipeController.deleteImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should pass correct parameters to service', async () => {
      vi.mocked(RecipeService.deleteImage).mockResolvedValue(undefined);

      await RecipeController.deleteImage(mockReq as AuthRequest, mockRes as Response);

      expect(RecipeService.deleteImage).toHaveBeenCalledWith('image-1', 'user-123', UserRole.MEMBER);
    });

    it('should handle not found errors', async () => {
      vi.mocked(RecipeService.deleteImage).mockRejectedValue(new Error('Image not found'));

      await RecipeController.deleteImage(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Image not found',
        })
      );
    });
  });
});
