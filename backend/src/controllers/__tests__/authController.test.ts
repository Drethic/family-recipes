import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { AuthController } from '../authController';
import { AuthService } from '../../services/authService';
import { AuthRequest, UserRole } from '../../types';

vi.mock('../../services/authService');

describe('AuthController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let cookieMock: ReturnType<typeof vi.fn>;
  let clearCookieMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      body: {},
      cookies: {},
      user: undefined,
    };

    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn();
    cookieMock = vi.fn();
    clearCookieMock = vi.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock,
      cookie: cookieMock,
      clearCookie: clearCookieMock,
    };
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      vi.mocked(AuthService.register).mockResolvedValue(mockUser);
      vi.mocked(AuthService.sanitizeUser).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(AuthService.generateAccessToken).mockReturnValue('access_token');
      vi.mocked(AuthService.generateRefreshToken).mockReturnValue('refresh_token');

      await AuthController.register(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(cookieMock).toHaveBeenCalledWith('refreshToken', 'refresh_token', expect.any(Object));
    });

    it('should handle registration errors', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      vi.mocked(AuthService.register).mockRejectedValue(
        new Error('User with this email already exists')
      );

      await AuthController.register(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User with this email already exists',
        })
      );
    });

    it('should set httpOnly cookie for refresh token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      vi.mocked(AuthService.register).mockResolvedValue(mockUser);
      vi.mocked(AuthService.sanitizeUser).mockReturnValue({} as never);
      vi.mocked(AuthService.generateAccessToken).mockReturnValue('access_token');
      vi.mocked(AuthService.generateRefreshToken).mockReturnValue('refresh_token');

      await AuthController.register(mockReq as AuthRequest, mockRes as Response);

      expect(cookieMock).toHaveBeenCalledWith(
        'refreshToken',
        'refresh_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        })
      );
    });

    it('should handle unknown errors', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      vi.mocked(AuthService.register).mockRejectedValue('Unknown error');

      await AuthController.register(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Registration failed',
        })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(AuthService.login).mockResolvedValue(mockUser);
      vi.mocked(AuthService.sanitizeUser).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(AuthService.generateAccessToken).mockReturnValue('access_token');
      vi.mocked(AuthService.generateRefreshToken).mockReturnValue('refresh_token');

      await AuthController.login(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      vi.mocked(AuthService.login).mockRejectedValue(new Error('Invalid email or password'));

      await AuthController.login(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid email or password',
        })
      );
    });

    it('should set refresh token cookie on login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(AuthService.login).mockResolvedValue(mockUser);
      vi.mocked(AuthService.sanitizeUser).mockReturnValue({} as never);
      vi.mocked(AuthService.generateAccessToken).mockReturnValue('access_token');
      vi.mocked(AuthService.generateRefreshToken).mockReturnValue('refresh_token');

      await AuthController.login(mockReq as AuthRequest, mockRes as Response);

      expect(cookieMock).toHaveBeenCalledWith('refreshToken', 'refresh_token', expect.any(Object));
    });

    it('should handle unapproved user login', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(AuthService.login).mockRejectedValue(
        new Error('Your account is pending approval')
      );

      await AuthController.login(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should handle unknown login errors', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(AuthService.login).mockRejectedValue('Unknown error');

      await AuthController.login(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Login failed',
        })
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq.cookies = {
        refreshToken: 'valid_refresh_token',
      };

      vi.mocked(AuthService.verifyRefreshToken).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
      });
      vi.mocked(AuthService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(AuthService.generateAccessToken).mockReturnValue('new_access_token');
      vi.mocked(AuthService.generateRefreshToken).mockReturnValue('new_refresh_token');

      await AuthController.refresh(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalled();
    });

    it('should return 401 if refresh token not found', async () => {
      mockReq.cookies = {};

      await AuthController.refresh(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Refresh token not found',
        })
      );
    });

    it('should return 401 if user not found', async () => {
      mockReq.cookies = {
        refreshToken: 'valid_refresh_token',
      };

      vi.mocked(AuthService.verifyRefreshToken).mockReturnValue({
        id: 'nonexistent',
        email: 'test@example.com',
        role: UserRole.MEMBER,
      });
      vi.mocked(AuthService.getUserById).mockResolvedValue(null);

      await AuthController.refresh(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
        })
      );
    });

    it('should handle invalid refresh token', async () => {
      mockReq.cookies = {
        refreshToken: 'invalid_token',
      };

      vi.mocked(AuthService.verifyRefreshToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await AuthController.refresh(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid refresh token',
        })
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token cookie', async () => {
      await AuthController.logout(mockReq as AuthRequest, mockRes as Response);

      expect(clearCookieMock).toHaveBeenCalledWith('refreshToken');
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should send success response', async () => {
      await AuthController.logout(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful',
        })
      );
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
      };

      vi.mocked(AuthService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(AuthService.sanitizeUser).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.MEMBER,
        is_approved: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await AuthController.getMe(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should return 401 if not authenticated', async () => {
      mockReq.user = undefined;

      await AuthController.getMe(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authenticated',
        })
      );
    });

    it('should return 401 if user not found', async () => {
      mockReq.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
      };

      vi.mocked(AuthService.getUserById).mockResolvedValue(null);

      await AuthController.getMe(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockReq.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
      };

      vi.mocked(AuthService.getUserById).mockRejectedValue(new Error('Database error'));

      await AuthController.getMe(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should handle unknown errors', async () => {
      mockReq.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MEMBER,
      };

      vi.mocked(AuthService.getUserById).mockRejectedValue('Unknown error');

      await AuthController.getMe(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to get user',
        })
      );
    });
  });
});
