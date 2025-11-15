import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { validateRequest } from '../validateRequest';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
}));

describe('ValidateRequest Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {};

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();

    mockRes = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json'],
    };

    mockNext = vi.fn();
  });

  it('calls next() when validation passes', () => {
    vi.mocked(validationResult).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    } as unknown as ReturnType<typeof validationResult>);

    validateRequest(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('returns 400 when validation fails', () => {
    vi.mocked(validationResult).mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { path: 'email', msg: 'Invalid email format' },
        { path: 'password', msg: 'Password too short' },
      ],
    } as ReturnType<typeof validationResult>);

    validateRequest(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('handles single validation error', () => {
    vi.mocked(validationResult).mockReturnValue({
      isEmpty: () => false,
      array: () => [{ path: 'username', msg: 'Username is required' }],
    } as ReturnType<typeof validationResult>);

    validateRequest(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [{ field: 'username', message: 'Username is required' }],
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('handles errors without path field', () => {
    vi.mocked(validationResult).mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'General validation error' }],
    } as ReturnType<typeof validationResult>);

    validateRequest(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [{ field: 'unknown', message: 'General validation error' }],
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('handles multiple errors for same field', () => {
    vi.mocked(validationResult).mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { path: 'password', msg: 'Password too short' },
        { path: 'password', msg: 'Password must contain a number' },
        { path: 'password', msg: 'Password must contain a special character' },
      ],
    } as ReturnType<typeof validationResult>);

    validateRequest(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [
          { field: 'password', message: 'Password too short' },
          { field: 'password', message: 'Password must contain a number' },
          { field: 'password', message: 'Password must contain a special character' },
        ],
      })
    );
  });

  it('transforms error format correctly', () => {
    vi.mocked(validationResult).mockReturnValue({
      isEmpty: () => false,
      array: () => [{ path: 'title', msg: 'Title must be at least 3 characters' }],
    } as ReturnType<typeof validationResult>);

    validateRequest(mockReq as Request, mockRes as Response, mockNext);

    const callArgs = jsonMock.mock.calls[0][0];
    expect(callArgs.errors[0]).toHaveProperty('field');
    expect(callArgs.errors[0]).toHaveProperty('message');
    expect(callArgs.errors[0].field).toBe('title');
    expect(callArgs.errors[0].message).toBe('Title must be at least 3 characters');
  });
});
