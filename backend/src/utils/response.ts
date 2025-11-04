import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  errors?: any[],
  statusCode: number = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message?: string): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

export const sendUnauthorized = (res: Response, message: string = 'Unauthorized'): Response => {
  return sendError(res, message, undefined, 401);
};

export const sendForbidden = (res: Response, message: string = 'Forbidden'): Response => {
  return sendError(res, message, undefined, 403);
};

export const sendNotFound = (res: Response, message: string = 'Resource not found'): Response => {
  return sendError(res, message, undefined, 404);
};

export const sendServerError = (res: Response, message: string = 'Internal server error'): Response => {
  return sendError(res, message, undefined, 500);
};
