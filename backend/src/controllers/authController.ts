import { Response } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError, sendCreated, sendUnauthorized } from '../utils/response';

export class AuthController {
  static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      const user = await AuthService.register(email, password, firstName, lastName);
      const sanitizedUser = AuthService.sanitizeUser(user);
      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendCreated(res, {
        user: sanitizedUser,
        accessToken,
      }, 'User registered successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      sendError(res, message, undefined, 400);
    }
  }

  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await AuthService.login(email, password);
      const sanitizedUser = AuthService.sanitizeUser(user);
      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(res, {
        user: sanitizedUser,
        accessToken,
      }, 'Login successful');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      sendUnauthorized(res, message);
    }
  }

  static async refresh(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        sendUnauthorized(res, 'Refresh token not found');
        return;
      }

      const decoded = AuthService.verifyRefreshToken(refreshToken);
      const user = await AuthService.getUserById(decoded.id);

      if (!user) {
        sendUnauthorized(res, 'User not found');
        return;
      }

      const newAccessToken = AuthService.generateAccessToken(user);
      const newRefreshToken = AuthService.generateRefreshToken(user);

      // Set new refresh token
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        accessToken: newAccessToken,
      }, 'Token refreshed successfully');
    } catch (_error: unknown) {
      sendUnauthorized(res, 'Invalid refresh token');
    }
  }

  static async logout(_req: AuthRequest, res: Response): Promise<void> {
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logout successful');
  }

  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendUnauthorized(res, 'Not authenticated');
        return;
      }

      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        sendUnauthorized(res, 'User not found');
        return;
      }

      const sanitizedUser = AuthService.sanitizeUser(user);
      sendSuccess(res, sanitizedUser);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      sendError(res, message, undefined, 500);
    }
  }
}
