import { Response } from 'express';
import { AuthRequest, UserRole } from '../types';
import db from '../config/database';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError, sendNotFound, sendNoContent } from '../utils/response';

export class UserController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const totalResult = await db('users').count('* as count').first();
      const total = parseInt(totalResult?.count as string) || 0;

      const users = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at', 'is_approved')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to get users', undefined, 500);
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at')
        .where('id', id)
        .first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, user);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to get user', undefined, 500);
    }
  }

  static async updateRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        sendError(res, 'Invalid role', undefined, 400);
        return;
      }

      const user = await db('users').where('id', id).first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      await db('users').where('id', id).update({ role });

      const updatedUser = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at')
        .where('id', id)
        .first();

      sendSuccess(res, updatedUser, 'User role updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update user role', undefined, 500);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent users from deleting themselves
      if (req.user?.id === id) {
        sendError(res, 'You cannot delete your own account', undefined, 400);
        return;
      }

      const user = await db('users').where('id', id).first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      await db('users').where('id', id).del();

      sendNoContent(res);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete user', undefined, 500);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, email } = req.body;

      // Only admins can update other users, users can update themselves
      if (req.user?.role !== UserRole.ADMIN && req.user?.id !== id) {
        sendError(res, 'Forbidden', undefined, 403);
        return;
      }

      const user = await db('users').where('id', id).first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      const updateData: any = {};
      if (firstName !== undefined) {
        updateData.first_name = firstName;
      }
      if (lastName !== undefined) {
        updateData.last_name = lastName;
      }
      if (email !== undefined) {
        // Check if email is already taken
        const existingUser = await db('users').where('email', email).whereNot('id', id).first();
        if (existingUser) {
          sendError(res, 'Email already in use', undefined, 400);
          return;
        }
        updateData.email = email;
      }

      if (Object.keys(updateData).length > 0) {
        await db('users').where('id', id).update(updateData);
      }

      const updatedUser = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at')
        .where('id', id)
        .first();

      sendSuccess(res, updatedUser, 'Profile updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update profile', undefined, 500);
    }
  }

  static async approveUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await db('users').where('id', id).first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      if (user.is_approved) {
        sendError(res, 'User is already approved', undefined, 400);
        return;
      }

      await db('users').where('id', id).update({
        is_approved: true,
        approved_at: db.fn.now(),
        approved_by_id: req.user?.id,
      });

      const approvedUser = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at', 'is_approved')
        .where('id', id)
        .first();

      sendSuccess(res, approvedUser, 'User approved successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to approve user', undefined, 500);
    }
  }

  static async rejectUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await db('users').where('id', id).first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      // Delete unapproved users instead of just marking them
      await db('users').where('id', id).del();

      sendSuccess(res, null, 'User rejected and removed');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to reject user', undefined, 500);
    }
  }

  static async updateTheme(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { themePreference } = req.body;

      // Users can only update their own theme
      if (req.user?.id !== id) {
        sendError(res, 'Forbidden', undefined, 403);
        return;
      }

      const user = await db('users').where('id', id).first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      await db('users').where('id', id).update({ theme_preference: themePreference });

      const updatedUser = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'role', 'theme_preference', 'created_at')
        .where('id', id)
        .first();

      sendSuccess(res, updatedUser, 'Theme preference updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update theme preference', undefined, 500);
    }
  }

  static async updatePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Users can only update their own password (unless admin)
      if (req.user?.role !== UserRole.ADMIN && req.user?.id !== id) {
        sendError(res, 'Forbidden', undefined, 403);
        return;
      }

      const user = await db('users').where('id', id).first();

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      // If not admin, verify current password
      if (req.user?.role !== UserRole.ADMIN) {
        const isPasswordValid = await AuthService.comparePassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
          sendError(res, 'Current password is incorrect', undefined, 400);
          return;
        }
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        sendError(res, 'New password must be at least 6 characters', undefined, 400);
        return;
      }

      const hashedPassword = await AuthService.hashPassword(newPassword);
      await db('users').where('id', id).update({ password_hash: hashedPassword });

      sendSuccess(res, null, 'Password updated successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update password', undefined, 500);
    }
  }
}
