import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import { UserService } from '../userService';
import db from '../../config/database';
import { UserRole } from '../../types';

vi.mock('../../config/database');
vi.mock('bcrypt');

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated users with default pagination', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: '10' }),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      const result = await UserService.getAll();

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(10);
    });

    it('should respect page parameter', async () => {
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

      await UserService.getAll(3, 20);

      expect(mockSelectChain.offset).toHaveBeenCalledWith(40);
    });

    it('should respect limit parameter', async () => {
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

      await UserService.getAll(1, 50);

      expect(mockSelectChain.limit).toHaveBeenCalledWith(50);
    });

    it('should order by created_at desc', async () => {
      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: '0' }),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      await UserService.getAll();

      expect(mockSelectChain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });

    it('should handle empty result', async () => {
      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: '0' }),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      const result = await UserService.getAll();

      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle null count result', async () => {
      const mockCountChain = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).mockReturnValueOnce(mockCountChain as never);
      vi.mocked(db).mockReturnValueOnce(mockSelectChain as never);

      const result = await UserService.getAll();

      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);

      const result = await UserService.getById('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);

      const result = await UserService.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('should select only specific fields', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);

      await UserService.getById('user-123');

      expect(mockDbChain.select).toHaveBeenCalledWith(
        'id',
        'email',
        'first_name',
        'last_name',
        'role',
        'created_at',
        'updated_at'
      );
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

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);

      vi.spyOn(UserService, 'getById').mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      } as never);

      const result = await UserService.updateRole('user-123', UserRole.ADMIN);

      expect(result?.role).toBe(UserRole.ADMIN);
    });

    it('should return null for non-existent user', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      const result = await UserService.updateRole('nonexistent', UserRole.ADMIN);

      expect(result).toBeNull();
    });

    it('should call update with correct role', async () => {
      const mockUser = { id: 'user-123', role: UserRole.MEMBER };

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

      vi.spyOn(UserService, 'getById').mockResolvedValue({ ...mockUser } as never);

      await UserService.updateRole('user-123', UserRole.ADMIN);

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ role: UserRole.ADMIN });
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

      const result = await UserService.delete('user-123');

      expect(result).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      const result = await UserService.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const mockUser = { id: 'user-123' };

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
      vi.mocked(bcrypt.hash).mockResolvedValue('new_hashed_password' as never);

      const result = await UserService.updatePassword('user-123', 'newPassword');

      expect(result).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
    });

    it('should return false for non-existent user', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      const result = await UserService.updatePassword('nonexistent', 'newPassword');

      expect(result).toBe(false);
    });

    it('should hash password before updating', async () => {
      const mockUser = { id: 'user-123' };

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
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pass' as never);

      await UserService.updatePassword('user-123', 'plaintext');

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ password_hash: 'hashed_pass' });
    });
  });

  describe('updateProfile', () => {
    it('should update firstName successfully', async () => {
      const mockUser = { id: 'user-123', first_name: 'Old' };

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

      vi.spyOn(UserService, 'getById').mockResolvedValue({
        ...mockUser,
        first_name: 'New',
      } as never);

      const result = await UserService.updateProfile('user-123', { firstName: 'New' });

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ first_name: 'New' });
      expect(result?.first_name).toBe('New');
    });

    it('should update lastName successfully', async () => {
      const mockUser = { id: 'user-123' };

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

      vi.spyOn(UserService, 'getById').mockResolvedValue(mockUser as never);

      await UserService.updateProfile('user-123', { lastName: 'NewLast' });

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ last_name: 'NewLast' });
    });

    it('should update email if not taken', async () => {
      const mockUser = { id: 'user-123', email: 'old@example.com' };

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

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockEmailCheckChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);

      vi.spyOn(UserService, 'getById').mockResolvedValue(mockUser as never);

      await UserService.updateProfile('user-123', { email: 'new@example.com' });

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ email: 'new@example.com' });
    });

    it('should throw error if email is already taken', async () => {
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

      await expect(
        UserService.updateProfile('user-123', { email: 'taken@example.com' })
      ).rejects.toThrow('Email already in use');
    });

    it('should return null for non-existent user', async () => {
      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      const result = await UserService.updateProfile('nonexistent', { firstName: 'Test' });

      expect(result).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      const mockUser = { id: 'user-123' };

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

      vi.mocked(db).mockReturnValueOnce(mockWhereChain as never);
      vi.mocked(db).mockReturnValueOnce(mockEmailCheckChain as never);
      vi.mocked(db).mockReturnValueOnce(mockUpdateChain as never);

      vi.spyOn(UserService, 'getById').mockResolvedValue(mockUser as never);

      await UserService.updateProfile('user-123', {
        firstName: 'New',
        lastName: 'Name',
        email: 'new@example.com',
      });

      expect(mockUpdateChain.update).toHaveBeenCalledWith({
        first_name: 'New',
        last_name: 'Name',
        email: 'new@example.com',
      });
    });

    it('should skip update if no fields provided', async () => {
      const mockUser = { id: 'user-123' };

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockWhereChain as never);

      vi.spyOn(UserService, 'getById').mockResolvedValue(mockUser as never);

      await UserService.updateProfile('user-123', {});

      expect(db).toHaveBeenCalledTimes(1);
    });
  });
});
