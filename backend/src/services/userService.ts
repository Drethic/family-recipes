import db from '../config/database';
import { User, UserRole } from '../types';
import bcrypt from 'bcrypt';

export class UserService {
  static async getAll(page: number = 1, limit: number = 20): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    const total = await db('users').count('* as count').first();
    const users = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      users,
      total: parseInt(total?.count as string) || 0,
    };
  }

  static async getById(id: string): Promise<User | null> {
    const user = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at', 'updated_at')
      .where('id', id)
      .first();

    return user || null;
  }

  static async updateRole(id: string, role: UserRole): Promise<User | null> {
    const user = await db('users').where('id', id).first();

    if (!user) {
      return null;
    }

    await db('users').where('id', id).update({ role });

    return this.getById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const user = await db('users').where('id', id).first();

    if (!user) {
      return false;
    }

    await db('users').where('id', id).del();
    return true;
  }

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const user = await db('users').where('id', id).first();

    if (!user) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db('users').where('id', id).update({ password_hash: hashedPassword });
    return true;
  }

  static async updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; email?: string }
  ): Promise<User | null> {
    const user = await db('users').where('id', id).first();

    if (!user) {
      return null;
    }

    const updateData: Partial<{ first_name: string; last_name: string; email: string }> = {};
    if (data.firstName !== undefined) {
updateData.first_name = data.firstName;
}
    if (data.lastName !== undefined) {
updateData.last_name = data.lastName;
}
    if (data.email !== undefined) {
      // Check if email is already taken
      const existingUser = await db('users').where('email', data.email).whereNot('id', id).first();
      if (existingUser) {
        throw new Error('Email already in use');
      }
      updateData.email = data.email;
    }

    if (Object.keys(updateData).length > 0) {
      await db('users').where('id', id).update(updateData);
    }

    return this.getById(id);
  }
}
