import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuthenticate } from '../auth';
import { AuthRequest } from '../../types';
import config from '../../config/env';

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();

    mockRes = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json'],
    };

    mockNext = vi.fn();
  });

  describe('authenticate', () => {
    it('calls next() for valid token', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'member' };
      const token = jwt.sign(payload, config.jwtSecret);

      mockReq.headers = { authorization: `Bearer ${token}` };

      authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(expect.objectContaining({ id: '123', role: 'member' }));
    });

    it('returns 401 for missing authorization header', () => {
      authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No token provided',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 for authorization header without Bearer prefix', () => {
      mockReq.headers = { authorization: 'InvalidFormat token123' };

      authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No token provided',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 for invalid token', () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };

      authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 for expired token', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'member' };
      const expiredToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '-1s' });

      mockReq.headers = { authorization: `Bearer ${expiredToken}` };

      authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token expired',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 for token signed with wrong secret', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'member' };
      const wrongToken = jwt.sign(payload, 'wrong-secret');

      mockReq.headers = { authorization: `Bearer ${wrongToken}` };

      authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('attaches decoded user to request', () => {
      const payload = { id: 'user-123', email: 'test@example.com', role: 'admin' };
      const token = jwt.sign(payload, config.jwtSecret);

      mockReq.headers = { authorization: `Bearer ${token}` };

      authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe('user-123');
      expect(mockReq.user?.role).toBe('admin');
    });
  });

  describe('optionalAuthenticate', () => {
    it('calls next() without user when no token provided', () => {
      optionalAuthenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('calls next() without user for invalid authorization header format', () => {
      mockReq.headers = { authorization: 'InvalidFormat token123' };

      optionalAuthenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('attaches user to request for valid token', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'member' };
      const token = jwt.sign(payload, config.jwtSecret);

      mockReq.headers = { authorization: `Bearer ${token}` };

      optionalAuthenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(expect.objectContaining({ id: '123', role: 'member' }));
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('calls next() without user for invalid token', () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };

      optionalAuthenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('calls next() without user for expired token', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'member' };
      const expiredToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '-1s' });

      mockReq.headers = { authorization: `Bearer ${expiredToken}` };

      optionalAuthenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('calls next() without user for token with wrong secret', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'member' };
      const wrongToken = jwt.sign(payload, 'wrong-secret');

      mockReq.headers = { authorization: `Bearer ${wrongToken}` };

      optionalAuthenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
