import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendServerError,
} from '../response';

describe('Response Utilities', () => {
  let mockRes: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let sendMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    sendMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();

    mockRes = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json'],
      send: sendMock as unknown as Response['send'],
    };
  });

  describe('sendSuccess', () => {
    it('sends success response with data and default 200 status', () => {
      const data = { id: '123', name: 'Test' };

      sendSuccess(mockRes as Response, data);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined,
      });
    });

    it('sends success response with custom message', () => {
      const data = { id: '123' };
      const message = 'Operation successful';

      sendSuccess(mockRes as Response, data, message);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });

    it('sends success response with custom status code', () => {
      const data = { value: 42 };

      sendSuccess(mockRes as Response, data, undefined, 201);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined,
      });
    });

    it('sends success response with both message and custom status', () => {
      const data = { result: 'done' };
      const message = 'Updated successfully';

      sendSuccess(mockRes as Response, data, message, 202);

      expect(statusMock).toHaveBeenCalledWith(202);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });

    it('sends success response with array data', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

      sendSuccess(mockRes as Response, data);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined,
      });
    });
  });

  describe('sendError', () => {
    it('sends error response with default 400 status', () => {
      sendError(mockRes as Response, 'Something went wrong');

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
        errors: undefined,
      });
    });

    it('sends error response with custom status code', () => {
      sendError(mockRes as Response, 'Custom error', undefined, 422);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error',
        errors: undefined,
      });
    });

    it('sends error response with errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid' }];

      sendError(mockRes as Response, 'Validation failed', errors);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors,
      });
    });

    it('sends error response with multiple errors', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];

      sendError(mockRes as Response, 'Multiple errors', errors, 422);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Multiple errors',
        errors,
      });
    });
  });

  describe('sendCreated', () => {
    it('sends 201 created response', () => {
      const data = { id: 'new-123', name: 'Created Item' };

      sendCreated(mockRes as Response, data);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined,
      });
    });

    it('sends 201 created response with message', () => {
      const data = { id: '456' };
      const message = 'Resource created';

      sendCreated(mockRes as Response, data, message);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });
  });

  describe('sendNoContent', () => {
    it('sends 204 no content response', () => {
      sendNoContent(mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('sendUnauthorized', () => {
    it('sends 401 unauthorized with default message', () => {
      sendUnauthorized(mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
        errors: undefined,
      });
    });

    it('sends 401 unauthorized with custom message', () => {
      sendUnauthorized(mockRes as Response, 'Invalid token');

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
        errors: undefined,
      });
    });
  });

  describe('sendForbidden', () => {
    it('sends 403 forbidden with default message', () => {
      sendForbidden(mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden',
        errors: undefined,
      });
    });

    it('sends 403 forbidden with custom message', () => {
      sendForbidden(mockRes as Response, 'Access denied');

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        errors: undefined,
      });
    });
  });

  describe('sendNotFound', () => {
    it('sends 404 not found with default message', () => {
      sendNotFound(mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        errors: undefined,
      });
    });

    it('sends 404 not found with custom message', () => {
      sendNotFound(mockRes as Response, 'Recipe not found');

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Recipe not found',
        errors: undefined,
      });
    });
  });

  describe('sendServerError', () => {
    it('sends 500 server error with default message', () => {
      sendServerError(mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        errors: undefined,
      });
    });

    it('sends 500 server error with custom message', () => {
      sendServerError(mockRes as Response, 'Database connection failed');

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed',
        errors: undefined,
      });
    });
  });
});
