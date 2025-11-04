import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../errorHandler';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockReq = {
      originalUrl: '/test/path',
    };

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();

    mockRes = {
      status: statusMock,
      json: jsonMock,
      headersSent: false,
    };

    mockNext = vi.fn();

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('errorHandler', () => {
    it('sends error response with default 500 status code', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Test error',
          errors: [],
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('sends error response with custom status code', () => {
      const error: any = new Error('Bad request');
      error.statusCode = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bad request',
        })
      );
    });

    it('includes custom errors array if provided', () => {
      const error: any = new Error('Validation failed');
      error.statusCode = 422;
      error.errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
          errors: [
            { field: 'email', message: 'Invalid email' },
            { field: 'password', message: 'Too short' },
          ],
        })
      );
    });

    it('uses default message if error has no message', () => {
      const error: any = {};

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal Server Error',
        })
      );
    });

    it('calls next() if headers already sent', () => {
      const error = new Error('Test error');
      mockRes.headersSent = true;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('handles error with status code 401', () => {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unauthorized',
        })
      );
    });

    it('handles error with status code 403', () => {
      const error: any = new Error('Forbidden');
      error.statusCode = 403;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Forbidden',
        })
      );
    });

    it('handles error with status code 404', () => {
      const error: any = new Error('Not found');
      error.statusCode = 404;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found',
        })
      );
    });

    it('logs error to console', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('notFoundHandler', () => {
    it('sends 404 response with route information', () => {
      mockReq.originalUrl = '/api/nonexistent';

      notFoundHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Route /api/nonexistent not found',
        })
      );
    });

    it('handles root path not found', () => {
      mockReq.originalUrl = '/';

      notFoundHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Route / not found',
        })
      );
    });

    it('handles complex path not found', () => {
      mockReq.originalUrl = '/api/v1/recipes/123/ingredients/456';

      notFoundHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Route /api/v1/recipes/123/ingredients/456 not found',
        })
      );
    });
  });
});
