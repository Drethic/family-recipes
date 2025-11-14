import { Response } from 'express';
import { AuthRequest, RecipeStatus } from '../types';
import { RecipeService } from '../services/recipeService';
import { sendSuccess, sendError, sendCreated, sendNotFound, sendNoContent } from '../utils/response';
import uploadService from '../services/uploadService';

export class RecipeController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as RecipeStatus | undefined;

      const { recipes, total } = await RecipeService.getAll(
        req.user?.id,
        req.user?.role,
        page,
        limit,
        status
      );

      sendSuccess(res, {
        recipes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get recipes';
      sendError(res, message, undefined, 500);
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recipe = await RecipeService.getById(id, req.user?.id, req.user?.role);

      if (!recipe) {
        sendNotFound(res, 'Recipe not found');
        return;
      }

      sendSuccess(res, recipe);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get recipe';
      sendError(res, message, undefined, 500);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const recipe = await RecipeService.create(req.body, req.user.id, req.user.role);

      sendCreated(res, recipe, 'Recipe created successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create recipe';
      sendError(res, message, undefined, 400);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const { id } = req.params;

      const recipe = await RecipeService.update(id, req.body, req.user.id, req.user.role);

      if (!recipe) {
        sendNotFound(res, 'Recipe not found');
        return;
      }

      sendSuccess(res, recipe, 'Recipe updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update recipe';
      if (message.includes('permission')) {
        sendError(res, message, undefined, 403);
        return;
      }
      sendError(res, message, undefined, 400);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const { id } = req.params;

      const deleted = await RecipeService.delete(id, req.user.id, req.user.role);

      if (!deleted) {
        sendNotFound(res, 'Recipe not found');
        return;
      }

      sendNoContent(res);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete recipe';
      if (message.includes('permission')) {
        sendError(res, message, undefined, 403);
        return;
      }
      sendError(res, message, undefined, 500);
    }
  }

  static async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const { id } = req.params;

      const recipe = await RecipeService.approve(id, req.user.id);

      if (!recipe) {
        sendNotFound(res, 'Recipe not found');
        return;
      }

      sendSuccess(res, recipe, 'Recipe approved successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to approve recipe';
      sendError(res, message, undefined, 500);
    }
  }

  static async reject(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const { id } = req.params;

      const recipe = await RecipeService.reject(id, req.user.id);

      if (!recipe) {
        sendNotFound(res, 'Recipe not found');
        return;
      }

      sendSuccess(res, recipe, 'Recipe rejected successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject recipe';
      sendError(res, message, undefined, 500);
    }
  }

  static async getMyRecipes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const recipes = await RecipeService.getUserRecipes(req.user.id);

      sendSuccess(res, recipes);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get user recipes';
      sendError(res, message, undefined, 500);
    }
  }

  // Image management methods
  static async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      if (!req.file) {
        sendError(res, 'No image file provided', undefined, 400);
        return;
      }

      const { id } = req.params;
      const { altText, isPrimary, orderIndex, instructionId } = req.body;

      // Upload image to storage
      const { url } = await uploadService.uploadImage(req.file, 'recipes');

      // Save image metadata to database
      const image = await RecipeService.addImage(
        id,
        url,
        altText || 'Recipe image',
        isPrimary === 'true' || isPrimary === true,
        parseInt(orderIndex) || 0,
        instructionId || null,
        req.user.id,
        req.user.role
      );

      sendCreated(res, image, 'Image uploaded successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      if (message.includes('permission')) {
        sendError(res, message, undefined, 403);
        return;
      }
      if (message.includes('Maximum') || message.includes('already has')) {
        sendError(res, message, undefined, 400);
        return;
      }
      sendError(res, message, undefined, 500);
    }
  }

  static async updateImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const { imageId } = req.params;
      const { altText, isPrimary, orderIndex } = req.body;

      const image = await RecipeService.updateImage(
        imageId,
        {
          altText,
          isPrimary,
          orderIndex,
        },
        req.user.id,
        req.user.role
      );

      if (!image) {
        sendNotFound(res, 'Image not found');
        return;
      }

      sendSuccess(res, image, 'Image updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update image';
      if (message.includes('permission')) {
        sendError(res, message, undefined, 403);
        return;
      }
      sendError(res, message, undefined, 500);
    }
  }

  static async deleteImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', undefined, 401);
        return;
      }

      const { imageId } = req.params;

      const deleted = await RecipeService.deleteImage(imageId, req.user.id, req.user.role);

      if (!deleted) {
        sendNotFound(res, 'Image not found');
        return;
      }

      sendNoContent(res);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete image';
      if (message.includes('permission')) {
        sendError(res, message, undefined, 403);
        return;
      }
      sendError(res, message, undefined, 500);
    }
  }
}
