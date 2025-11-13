import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { CategoryController } from '../categoryController';
import db from '../../config/database';
import { AuthRequest, UserRole } from '../../types';

vi.mock('../../config/database');

describe('CategoryController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
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
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Desserts', slug: 'desserts' },
        { id: 'cat-2', name: 'Main Courses', slug: 'main-courses' },
      ];

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockCategories),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      await CategoryController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCategories,
        })
      );
    });

    it('should order categories by name', async () => {
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      await CategoryController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(mockSelectChain.orderBy).toHaveBeenCalledWith('name', 'asc');
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      await CategoryController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Database error',
        })
      );
    });

    it('should handle unknown errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw 'Unknown error';
      });

      await CategoryController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to get categories',
        })
      );
    });
  });

  describe('getById', () => {
    it('should return category by id', async () => {
      const mockCategory = { id: 'cat-1', name: 'Desserts', slug: 'desserts' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCategory),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'cat-1' };

      await CategoryController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCategory,
        })
      );
    });

    it('should return 404 if category not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'nonexistent' };

      await CategoryController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category not found',
        })
      );
    });

    it('should query correct category id', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'cat-1' }),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'cat-1' };

      await CategoryController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(mockWhereChain.where).toHaveBeenCalledWith('id', 'cat-1');
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'cat-1' };

      await CategoryController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      const mockCategory = { id: 'cat-1', name: 'New Category', slug: 'new-category' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCategory]),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInsertChain as never);

      mockReq.body = { name: 'New Category', slug: 'new-category' };

      await CategoryController.create(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCategory,
          message: 'Category created successfully',
        })
      );
    });

    it('should return 400 if slug already exists', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'existing-cat' }),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.body = { name: 'New Category', slug: 'existing-slug' };

      await CategoryController.create(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category with this slug already exists',
        })
      );
    });

    it('should check for existing slug before creating', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'cat-1' }]),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInsertChain as never);

      mockReq.body = { name: 'Test', slug: 'test-slug' };

      await CategoryController.create(mockReq as AuthRequest, mockRes as Response);

      expect(mockWhereChain.where).toHaveBeenCalledWith('slug', 'test-slug');
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.body = { name: 'Test', slug: 'test' };

      await CategoryController.create(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database error',
        })
      );
    });

    it('should handle unknown errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw 'Unknown error';
      });

      mockReq.body = { name: 'Test', slug: 'test' };

      await CategoryController.create(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to create category',
        })
      );
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const mockCategory = { id: 'cat-1', name: 'Old Name', slug: 'old-slug' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCategory),
      };

      const mockSlugCheckChain = {
        where: vi.fn().mockReturnThis(),
        whereNot: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockFinalWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ ...mockCategory, name: 'New Name' }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSlugCheckChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockFinalWhereChain as never);

      mockReq.params = { id: 'cat-1' };
      mockReq.body = { name: 'New Name', slug: 'new-slug' };

      await CategoryController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Category updated successfully',
        })
      );
    });

    it('should return 404 if category not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { name: 'Test' };

      await CategoryController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 if new slug conflicts with existing', async () => {
      const mockCategory = { id: 'cat-1', slug: 'old-slug' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCategory),
      };

      const mockSlugCheckChain = {
        where: vi.fn().mockReturnThis(),
        whereNot: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'other-cat' }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSlugCheckChain as never);

      mockReq.params = { id: 'cat-1' };
      mockReq.body = { slug: 'existing-slug' };

      await CategoryController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Category with this slug already exists',
        })
      );
    });

    it('should allow updating name without slug', async () => {
      const mockCategory = { id: 'cat-1', slug: 'same-slug' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCategory),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockFinalWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCategory),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockFinalWhereChain as never);

      mockReq.params = { id: 'cat-1' };
      mockReq.body = { name: 'New Name' };

      await CategoryController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'cat-1' };
      mockReq.body = { name: 'Test' };

      await CategoryController.update(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      const mockCategory = { id: 'cat-1' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCategory),
      };

      const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        del: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockDeleteChain as never);

      mockReq.params = { id: 'cat-1' };

      await CategoryController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should return 404 if category not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'nonexistent' };

      await CategoryController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'cat-1' };

      await CategoryController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database error',
        })
      );
    });

    it('should handle unknown errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw 'Unknown error';
      });

      mockReq.params = { id: 'cat-1' };

      await CategoryController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to delete category',
        })
      );
    });
  });
});
