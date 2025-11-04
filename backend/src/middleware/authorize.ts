import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { sendForbidden, sendUnauthorized } from '../utils/response';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendForbidden(res, 'You do not have permission to access this resource');
      return;
    }

    next();
  };
};

export const isAdmin = authorize(UserRole.ADMIN);
export const isMemberOrAdmin = authorize(UserRole.MEMBER, UserRole.ADMIN);
