import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import config from '../config/env';
import { User, TokenPayload, UserRole } from '../types';

export class AuthService {
  private static SALT_ROUNDS = 10;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as string,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn as string,
    } as jwt.SignOptions);
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
  }

  static async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.MEMBER
  ): Promise<User> {
    const existingUser = await db('users').where({ email }).first();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(password);

    const [user] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
      })
      .returning('*');

    return user;
  }

  static async login(email: string, password: string): Promise<User> {
    const user = await db('users').where({ email }).first();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_approved) {
      throw new Error('Your account is pending approval. Please contact an administrator.');
    }

    return user;
  }

  static async getUserById(id: string): Promise<User | null> {
    const user = await db('users').where({ id }).first();
    return user || null;
  }

  static sanitizeUser(user: User): Omit<User, 'password_hash'> {
    const { password_hash: _password_hash, ...sanitized } = user;
    return sanitized;
  }
}
