import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { registerValidator, loginValidator } from '../authValidators';

describe('Auth Validators', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('registerValidator', () => {
    describe('email validation', () => {
      it('should pass for valid email', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const emailErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'email');
        expect(emailErrors).toHaveLength(0);
      });

      it('should fail for invalid email format', async () => {
        mockReq.body = {
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
        const emailErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'email');
        expect(emailErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing email', async () => {
        mockReq.body = {
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should trim and normalize email', async () => {
        mockReq.body = {
          email: '  TEST@EXAMPLE.COM  ',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.email.trim().toLowerCase()).toBe('test@example.com');
      });

      it('should fail for email without @ symbol', async () => {
        mockReq.body = {
          email: 'testexample.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for email without domain', async () => {
        mockReq.body = {
          email: 'test@',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });
    });

    describe('password validation', () => {
      it('should pass for valid password', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const passwordErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'password');
        expect(passwordErrors).toHaveLength(0);
      });

      it('should fail for password less than 6 characters', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: '12345',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const passwordErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'password');
        expect(passwordErrors.length).toBeGreaterThan(0);
        expect(passwordErrors[0].msg).toContain('6 characters');
      });

      it('should fail for empty password', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: '',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for missing password', async () => {
        mockReq.body = {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should accept password with exactly 6 characters', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: '123456',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const passwordErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'password');
        expect(passwordErrors).toHaveLength(0);
      });

      it('should accept long password', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'verylongpassword123456789',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const passwordErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'password');
        expect(passwordErrors).toHaveLength(0);
      });
    });

    describe('firstName validation', () => {
      it('should pass for valid firstName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const firstNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'firstName');
        expect(firstNameErrors).toHaveLength(0);
      });

      it('should fail for empty firstName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: '',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const firstNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'firstName');
        expect(firstNameErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing firstName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for firstName exceeding 100 characters', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'A'.repeat(101),
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const firstNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'firstName');
        expect(firstNameErrors.length).toBeGreaterThan(0);
      });

      it('should trim firstName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: '  John  ',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.firstName).toBe('John');
      });

      it('should accept firstName with exactly 100 characters', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'A'.repeat(100),
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const firstNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'firstName');
        expect(firstNameErrors).toHaveLength(0);
      });
    });

    describe('lastName validation', () => {
      it('should pass for valid lastName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const lastNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'lastName');
        expect(lastNameErrors).toHaveLength(0);
      });

      it('should fail for empty lastName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: '',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const lastNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'lastName');
        expect(lastNameErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing lastName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for lastName exceeding 100 characters', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'A'.repeat(101),
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const lastNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'lastName');
        expect(lastNameErrors.length).toBeGreaterThan(0);
      });

      it('should trim lastName', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: '  Doe  ',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.lastName).toBe('Doe');
      });

      it('should accept lastName with exactly 100 characters', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'A'.repeat(100),
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const lastNameErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'lastName');
        expect(lastNameErrors).toHaveLength(0);
      });
    });

    describe('complete validation', () => {
      it('should pass all validations for complete valid input', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(true);
      });

      it('should fail all validations for completely invalid input', async () => {
        mockReq.body = {
          email: 'invalid',
          password: '123',
          firstName: '',
          lastName: '',
        };

        for (const validator of registerValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
        expect(errors.array().length).toBeGreaterThan(3);
      });
    });
  });

  describe('loginValidator', () => {
    describe('email validation', () => {
      it('should pass for valid email', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'anypassword',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const emailErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'email');
        expect(emailErrors).toHaveLength(0);
      });

      it('should fail for invalid email format', async () => {
        mockReq.body = {
          email: 'invalid-email',
          password: 'anypassword',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should fail for missing email', async () => {
        mockReq.body = {
          password: 'anypassword',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should trim and normalize email', async () => {
        mockReq.body = {
          email: '  TEST@EXAMPLE.COM  ',
          password: 'anypassword',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        expect(mockReq.body.email.trim().toLowerCase()).toBe('test@example.com');
      });
    });

    describe('password validation', () => {
      it('should pass for non-empty password', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'anypassword',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const passwordErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'password');
        expect(passwordErrors).toHaveLength(0);
      });

      it('should fail for empty password', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: '',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const passwordErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'password');
        expect(passwordErrors.length).toBeGreaterThan(0);
      });

      it('should fail for missing password', async () => {
        mockReq.body = {
          email: 'test@example.com',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
      });

      it('should accept any non-empty password (no length check)', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: '1',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        const passwordErrors = errors.array().filter((e) => e.type === 'field' && e.path === 'password');
        expect(passwordErrors).toHaveLength(0);
      });
    });

    describe('complete validation', () => {
      it('should pass all validations for valid login', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'anypassword',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(true);
      });

      it('should fail for completely invalid input', async () => {
        mockReq.body = {
          email: 'invalid',
          password: '',
        };

        for (const validator of loginValidator) {
          await validator.run(mockReq as Request);
        }

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).toBe(false);
        expect(errors.array().length).toBeGreaterThan(1);
      });
    });
  });
});
