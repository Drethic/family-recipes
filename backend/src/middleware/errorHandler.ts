import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

export const errorHandler = (
  err: unknown,
  _: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  const error = err as ErrorWithStatus;
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  sendError(res, message, errors, statusCode);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.originalUrl} not found`, undefined, 404);
};
