import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { authorize, isAdmin, isMemberOrAdmin } from '../authorize';
import { AuthRequest, UserRole } from '../../types';

describe('Authorize Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {};

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  describe('authorize', () => {
    it('calls next() when user has required role', () => {
      mockReq.user = { userId: '123', role: UserRole.MEMBER };
      const middleware = authorize(UserRole.MEMBER, UserRole.ADMIN);

      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('calls next() when user is admin and admin role is allowed', () => {
      mockReq.user = { userId: '123', role: UserRole.ADMIN };
      const middleware = authorize(UserRole.ADMIN);

      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('calls next() when admin accesses member-allowed route', () => {
      mockReq.user = { userId: '123', role: UserRole.ADMIN };
      const middleware = authorize(UserRole.MEMBER, UserRole.ADMIN);

      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('returns 403 when user lacks required role', () => {
      mockReq.user = { userId: '123', role: UserRole.MEMBER };
      const middleware = authorize(UserRole.ADMIN);

      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'You do not have permission to access this resource',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 when guest tries to access member route', () => {
      mockReq.user = { userId: '123', role: UserRole.GUEST };
      const middleware = authorize(UserRole.MEMBER);

      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when user is not authenticated', () => {
      // req.user is undefined
      const middleware = authorize(UserRole.MEMBER);

      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when req.user is null', () => {
      mockReq.user = undefined;
      const middleware = authorize(UserRole.ADMIN);

      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('allows admin users', () => {
      mockReq.user = { userId: '123', role: UserRole.ADMIN };

      isAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('blocks member users', () => {
      mockReq.user = { userId: '123', role: UserRole.MEMBER };

      isAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks guest users', () => {
      mockReq.user = { userId: '123', role: UserRole.GUEST };

      isAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks unauthenticated users', () => {
      isAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isMemberOrAdmin', () => {
    it('allows member users', () => {
      mockReq.user = { userId: '123', role: UserRole.MEMBER };

      isMemberOrAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('allows admin users', () => {
      mockReq.user = { userId: '123', role: UserRole.ADMIN };

      isMemberOrAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('blocks guest users', () => {
      mockReq.user = { userId: '123', role: UserRole.GUEST };

      isMemberOrAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('blocks unauthenticated users', () => {
      isMemberOrAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
