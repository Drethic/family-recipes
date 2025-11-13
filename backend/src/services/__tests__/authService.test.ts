import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../authService';
import db from '../../config/database';
import config from '../../config/env';
import { UserRole } from '../../types';

vi.mock('../../config/database');
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'myPassword123';
      const hashedPassword = 'hashed_password';

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await AuthService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should handle different passwords', async () => {
      const password = 'different_pass';
      vi.mocked(bcrypt.hash).mockResolvedValue('different_hash' as never);

      const result = await AuthService.hashPassword(password);

      expect(result).toBe('different_hash');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await AuthService.comparePassword('password', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await AuthService.comparePassword('wrong', 'hash');

      expect(result).toBe(false);
    });

    it('should handle empty password strings', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await AuthService.comparePassword('', 'hash');

      expect(result).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate token with correct payload', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
        password_hash: 'hash',
        first_name: 'John',
        last_name: 'Doe',
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(jwt.sign).mockReturnValue('access_token' as never);

      const token = AuthService.generateAccessToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      expect(token).toBe('access_token');
    });

    it('should generate token for admin user', () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        password_hash: 'hash',
        first_name: 'Admin',
        last_name: 'User',
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(jwt.sign).mockReturnValue('admin_token' as never);

      const token = AuthService.generateAccessToken(adminUser);

      expect(token).toBe('admin_token');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
        password_hash: 'hash',
        first_name: 'John',
        last_name: 'Doe',
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(jwt.sign).mockReturnValue('refresh_token' as never);

      const token = AuthService.generateRefreshToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpiresIn }
      );
      expect(token).toBe('refresh_token');
    });

    it('should use refresh secret not access secret', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
        password_hash: 'hash',
        first_name: 'John',
        last_name: 'Doe',
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      AuthService.generateRefreshToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        config.jwtRefreshSecret,
        expect.anything()
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return decoded token', () => {
      const payload = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
      };

      vi.mocked(jwt.verify).mockReturnValue(payload as never);

      const result = AuthService.verifyRefreshToken('token');

      expect(jwt.verify).toHaveBeenCalledWith('token', config.jwtRefreshSecret);
      expect(result).toEqual(payload);
    });

    it('should throw error for invalid token', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => AuthService.verifyRefreshToken('invalid')).toThrow('Invalid token');
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'new-user-id',
            email: 'new@example.com',
            password_hash: 'hashed',
            first_name: 'John',
            last_name: 'Doe',
            role: UserRole.MEMBER,
            is_approved: false,
          },
        ]),
      };

      vi.mocked(db).mockReturnValueOnce(mockDbChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInsertChain as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

      const user = await AuthService.register('new@example.com', 'password', 'John', 'Doe');

      expect(user.email).toBe('new@example.com');
      expect(user.first_name).toBe('John');
    });

    it('should throw error if user already exists', async () => {
      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'existing-user' }),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);

      await expect(
        AuthService.register('existing@example.com', 'password', 'John', 'Doe')
      ).rejects.toThrow('User with this email already exists');
    });

    it('should hash password before storing', async () => {
      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'new-user' }]),
      };

      vi.mocked(db).mockReturnValueOnce(mockDbChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInsertChain as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);

      await AuthService.register('test@example.com', 'plaintext', 'John', 'Doe');

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
    });

    it('should default role to MEMBER', async () => {
      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'new-user',
            role: UserRole.MEMBER,
          },
        ]),
      };

      vi.mocked(db).mockReturnValueOnce(mockDbChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInsertChain as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

      const user = await AuthService.register('test@example.com', 'password', 'John', 'Doe');

      expect(user.role).toBe(UserRole.MEMBER);
    });

    it('should accept custom role', async () => {
      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'admin-user',
            role: UserRole.ADMIN,
          },
        ]),
      };

      vi.mocked(db).mockReturnValueOnce(mockDbChain as never);
      vi.mocked(db).mockReturnValueOnce(mockInsertChain as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

      const user = await AuthService.register(
        'admin@example.com',
        'password',
        'Admin',
        'User',
        UserRole.ADMIN
      );

      expect(user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        is_approved: true,
      };

      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const user = await AuthService.login('test@example.com', 'password');

      expect(user).toEqual(mockUser);
    });

    it('should throw error for non-existent user', async () => {
      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);

      await expect(AuthService.login('nonexistent@example.com', 'password')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        is_approved: true,
      };

      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(AuthService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for unapproved user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        is_approved: false,
      };

      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(AuthService.login('test@example.com', 'password')).rejects.toThrow(
        'Your account is pending approval'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);

      const user = await AuthService.getUserById('user-123');

      expect(user).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockDbChain = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(db).mockReturnValue(mockDbChain as never);

      const user = await AuthService.getUserById('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password_hash from user object', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'secret_hash',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const sanitized = AuthService.sanitizeUser(user);

      expect(sanitized).not.toHaveProperty('password_hash');
      expect(sanitized).toHaveProperty('id');
      expect(sanitized).toHaveProperty('email');
    });

    it('should preserve all other user properties', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'secret_hash',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.ADMIN,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const sanitized = AuthService.sanitizeUser(user);

      expect(sanitized.id).toBe('user-123');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.first_name).toBe('John');
      expect(sanitized.last_name).toBe('Doe');
      expect(sanitized.role).toBe(UserRole.ADMIN);
    });
  });
});
