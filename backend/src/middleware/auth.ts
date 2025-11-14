import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, TokenPayload } from '../types';
import { sendUnauthorized } from '../utils/response';
import config from '../config/env';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      req.user = decoded;
      next();
    } catch (_error) {
      if (error instanceof jwt.TokenExpiredError) {
        sendUnauthorized(res, 'Token expired');
        return;
      }
      sendUnauthorized(res, 'Invalid token');
      return;
    }
  } catch (_error) {
    sendUnauthorized(res, 'Authentication failed');
    return;
  }
};

export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      req.user = decoded;
    } catch (_error) {
      // Token is invalid but we don't fail - just continue without user
    }

    next();
  } catch (_error) {
    next();
  }
};
