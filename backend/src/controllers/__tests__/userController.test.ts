import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { UserController } from '../userController';
import { AuthService } from '../../services/authService';
import db from '../../config/database';
import { AuthRequest, UserRole } from '../../types';

vi.mock('../../config/database');
vi.mock('../../services/authService');

describe('UserController', () => {
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
    it('should return paginated users with default pagination', async () => {
      const mockCountResult = { count: '10' };
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCountResult),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      await UserController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUsers,
          pagination: expect.objectContaining({
            page: 1,
            limit: 20,
            total: 10,
          }),
        })
      );
    });

    it('should respect page query parameter', async () => {
      mockReq.query = { page: '3' };

      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: '100' }),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      await UserController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(mockSelectChain.offset).toHaveBeenCalledWith(40);
    });

    it('should respect limit query parameter', async () => {
      mockReq.query = { limit: '50' };

      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: '100' }),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      await UserController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(mockSelectChain.limit).toHaveBeenCalledWith(50);
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await UserController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Database connection failed',
        })
      );
    });

    it('should calculate total pages correctly', async () => {
      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: '55' }),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      await UserController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 3,
          }),
        })
      );
    });

    it('should handle unknown errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw 'Unknown error';
      });

      await UserController.getAll(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to get users',
        })
      );
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      mockReq.params = { id: 'user-123' };

      await UserController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser,
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      mockReq.params = { id: 'nonexistent' };

      await UserController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };

      await UserController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should query correct user id', async () => {
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'test-id' }),
      };

      vi.mocked(db).mockReturnValue(mockSelectChain as never);

      mockReq.params = { id: 'test-id' };

      await UserController.getById(mockReq as AuthRequest, mockRes as Response);

      expect(mockSelectChain.where).toHaveBeenCalledWith('id', 'test-id');
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      const mockUser = { id: 'user-123', role: UserRole.MEMBER };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ ...mockUser, role: UserRole.ADMIN }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { role: UserRole.ADMIN };

      await UserController.updateRole(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User role updated successfully',
        })
      );
    });

    it('should return 400 for invalid role', async () => {
      mockReq.params = { id: 'user-123' };
      mockReq.body = { role: 'invalid_role' };

      await UserController.updateRole(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid role',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { role: UserRole.ADMIN };

      await UserController.updateRole(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };
      mockReq.body = { role: UserRole.ADMIN };

      await UserController.updateRole(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should accept all valid roles', async () => {
      const mockUser = { id: 'user-123', role: UserRole.MEMBER };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { role: UserRole.MEMBER };

      await UserController.updateRole(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockUser = { id: 'user-123' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        del: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockDeleteChain as never);

      mockReq.params = { id: 'user-123' };

      await UserController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should prevent user from deleting themselves', async () => {
      mockReq.params = { id: 'admin-123' };

      await UserController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You cannot delete your own account',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'nonexistent' };

      await UserController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle database errors', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'user-123' }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };

      await UserController.delete(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = { id: 'user-123', first_name: 'Old' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockEmailCheckChain = {
        where: vi.fn().mockReturnThis(),
        whereNot: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ ...mockUser, first_name: 'New' }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockEmailCheckChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { firstName: 'New', email: 'new@example.com' };
      mockReq.user = { id: 'admin-123', email: 'admin@example.com', role: UserRole.ADMIN };

      await UserController.updateProfile(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should allow user to update their own profile', async () => {
      const mockUser = { id: 'user-123' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { firstName: 'Updated' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updateProfile(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should prevent non-admin from updating other users', async () => {
      mockReq.params = { id: 'other-user' };
      mockReq.body = { firstName: 'Hacked' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updateProfile(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should return 404 if user not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { firstName: 'Test' };

      await UserController.updateProfile(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 if email is already taken', async () => {
      const mockUser = { id: 'user-123' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockEmailCheckChain = {
        where: vi.fn().mockReturnThis(),
        whereNot: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'other-user' }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockEmailCheckChain as never);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { email: 'taken@example.com' };

      await UserController.updateProfile(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already in use',
        })
      );
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };
      mockReq.body = { firstName: 'Test' };

      await UserController.updateProfile(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('approveUser', () => {
    it('should approve user successfully', async () => {
      const mockUser = { id: 'user-123', is_approved: false };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ ...mockUser, is_approved: true }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      Object.defineProperty(db, 'fn', {
        value: {
          now: vi.fn(() => new Date()),
        },
        writable: true,
        configurable: true,
      });

      mockReq.params = { id: 'user-123' };

      await UserController.approveUser(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User approved successfully',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      Object.defineProperty(db, 'fn', {
        value: {
          now: vi.fn(() => new Date()),
        },
        writable: true,
        configurable: true,
      });

      mockReq.params = { id: 'nonexistent' };

      await UserController.approveUser(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 if user already approved', async () => {
      const mockUser = { id: 'user-123', is_approved: true };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'user-123' };

      await UserController.approveUser(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User is already approved',
        })
      );
    });

    it('should set approved_by_id to current user', async () => {
      const mockUser = { id: 'user-123', is_approved: false };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      Object.defineProperty(db, 'fn', {
        value: {
          now: vi.fn(() => new Date()),
        },
        writable: true,
        configurable: true,
      });

      mockReq.params = { id: 'user-123' };

      await UserController.approveUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_approved: true,
          approved_by_id: 'admin-123',
        })
      );
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };

      await UserController.approveUser(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('rejectUser', () => {
    it('should reject and delete user successfully', async () => {
      const mockUser = { id: 'user-123' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        del: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockDeleteChain as never);

      Object.defineProperty(db, 'fn', {
        value: {
          now: vi.fn(() => new Date()),
        },
        writable: true,
        configurable: true,
      });

      mockReq.params = { id: 'user-123' };

      await UserController.rejectUser(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User rejected and removed',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      Object.defineProperty(db, 'fn', {
        value: {
          now: vi.fn(() => new Date()),
        },
        writable: true,
        configurable: true,
      });

      mockReq.params = { id: 'nonexistent' };

      await UserController.rejectUser(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };

      await UserController.rejectUser(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTheme', () => {
    it('should update theme preference successfully', async () => {
      const mockUser = { id: 'user-123', theme_preference: 'light' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ ...mockUser, theme_preference: 'dark' }),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { themePreference: 'dark' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updateTheme(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should prevent user from updating other users theme', async () => {
      mockReq.params = { id: 'other-user' };
      mockReq.body = { themePreference: 'dark' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updateTheme(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should return 404 if user not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { themePreference: 'dark' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updateTheme(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };
      mockReq.body = { themePreference: 'dark' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updateTheme(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully for own account', async () => {
      const mockUser = { id: 'user-123', password_hash: 'old_hash' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);

      vi.mocked(AuthService.comparePassword).mockResolvedValue(true);
      vi.mocked(AuthService.hashPassword).mockResolvedValue('new_hash');

      mockReq.params = { id: 'user-123' };
      mockReq.body = { currentPassword: 'oldpass', newPassword: 'newpass123' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should allow admin to update any password without current password', async () => {
      const mockUser = { id: 'other-user', password_hash: 'old_hash' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateChain = {
        where: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);

      vi.mocked(AuthService.hashPassword).mockResolvedValue('new_hash');

      mockReq.params = { id: 'other-user' };
      mockReq.body = { newPassword: 'newpass123' };
      mockReq.user = { id: 'admin-123', email: 'admin@example.com', role: UserRole.ADMIN };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should prevent non-admin from updating other users password', async () => {
      mockReq.params = { id: 'other-user' };
      mockReq.body = { newPassword: 'newpass123' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should return 404 if user not found', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { newPassword: 'newpass123' };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 if current password is incorrect', async () => {
      const mockUser = { id: 'user-123', password_hash: 'old_hash' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);
      vi.mocked(AuthService.comparePassword).mockResolvedValue(false);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { currentPassword: 'wrong', newPassword: 'newpass123' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Current password is incorrect',
        })
      );
    });

    it('should return 400 if new password is too short', async () => {
      const mockUser = { id: 'user-123', password_hash: 'old_hash' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);
      vi.mocked(AuthService.comparePassword).mockResolvedValue(true);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { currentPassword: 'oldpass', newPassword: '123' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'New password must be at least 6 characters',
        })
      );
    });

    it('should return 400 if new password is empty', async () => {
      const mockUser = { id: 'user-123', password_hash: 'old_hash' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);
      vi.mocked(AuthService.comparePassword).mockResolvedValue(true);

      mockReq.params = { id: 'user-123' };
      mockReq.body = { currentPassword: 'oldpass', newPassword: '' };
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: UserRole.MEMBER };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should handle database errors', async () => {
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockReq.params = { id: 'user-123' };
      mockReq.body = { newPassword: 'newpass123' };

      await UserController.updatePassword(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
