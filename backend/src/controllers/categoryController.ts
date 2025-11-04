import { Response } from 'express';
import { AuthRequest } from '../types';
import db from '../config/database';
import { sendSuccess, sendError, sendCreated, sendNotFound, sendNoContent } from '../utils/response';

export class CategoryController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await db('categories').select('*').orderBy('name', 'asc');

      sendSuccess(res, categories);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to get categories', undefined, 500);
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const category = await db('categories').where('id', id).first();

      if (!category) {
        sendNotFound(res, 'Category not found');
        return;
      }

      sendSuccess(res, category);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to get category', undefined, 500);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, slug } = req.body;

      // Check if slug already exists
      const existing = await db('categories').where('slug', slug).first();

      if (existing) {
        sendError(res, 'Category with this slug already exists', undefined, 400);
        return;
      }

      const [category] = await db('categories')
        .insert({
          name,
          slug,
        })
        .returning('*');

      sendCreated(res, category, 'Category created successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create category', undefined, 400);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, slug } = req.body;

      const category = await db('categories').where('id', id).first();

      if (!category) {
        sendNotFound(res, 'Category not found');
        return;
      }

      // Check if new slug conflicts with another category
      if (slug && slug !== category.slug) {
        const existing = await db('categories').where('slug', slug).whereNot('id', id).first();

        if (existing) {
          sendError(res, 'Category with this slug already exists', undefined, 400);
          return;
        }
      }

      const updateData: any = {};
      if (name) {
        updateData.name = name;
      }
      if (slug) {
        updateData.slug = slug;
      }

      await db('categories').where('id', id).update(updateData);

      const updatedCategory = await db('categories').where('id', id).first();

      sendSuccess(res, updatedCategory, 'Category updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update category', undefined, 500);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const category = await db('categories').where('id', id).first();

      if (!category) {
        sendNotFound(res, 'Category not found');
        return;
      }

      await db('categories').where('id', id).del();

      sendNoContent(res);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete category', undefined, 500);
    }
  }
}
