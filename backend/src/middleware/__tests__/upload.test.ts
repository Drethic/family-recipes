import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request } from 'express';
import multer from 'multer';
import upload, { uploadSingle, uploadMultiple, uploadFields, fileFilter } from '../upload';
import config from '../../config/env';

describe('Upload Middleware', () => {
  describe('upload instance', () => {
    it('should export a multer instance', () => {
      expect(upload).toBeDefined();
      expect(typeof upload).toBe('object');
    });

    it('should have single method', () => {
      expect(upload.single).toBeDefined();
      expect(typeof upload.single).toBe('function');
    });

    it('should have array method', () => {
      expect(upload.array).toBeDefined();
      expect(typeof upload.array).toBe('function');
    });

    it('should have fields method', () => {
      expect(upload.fields).toBeDefined();
      expect(typeof upload.fields).toBe('function');
    });
  });

  describe('fileFilter', () => {
    let mockCallback: multer.FileFilterCallback;
    let mockRequest: Partial<Request>;

    beforeEach(() => {
      mockCallback = vi.fn();
      mockRequest = {};
    });

    it('should accept allowed file types (image/jpeg)', () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      fileFilter(mockRequest as Request, mockFile, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should accept allowed file types (image/png)', () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      fileFilter(mockRequest as Request, mockFile, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should accept allowed file types (image/webp)', () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      fileFilter(mockRequest as Request, mockFile, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should reject disallowed file types', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      fileFilter(mockRequest as Request, mockFile, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid file type: application/pdf')
        })
      );
    });

    it('should include allowed types in error message', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      fileFilter(mockRequest as Request, mockFile, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Allowed types:')
        })
      );
    });
  });

  describe('uploadSingle', () => {
    it('should return a middleware function', () => {
      const middleware = uploadSingle('image');
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create single file upload middleware for given field', () => {
      const fieldName = 'avatar';
      const middleware = uploadSingle(fieldName);
      expect(middleware).toBeDefined();
    });

    it('should accept different field names', () => {
      const middleware1 = uploadSingle('image');
      const middleware2 = uploadSingle('photo');
      expect(middleware1).toBeDefined();
      expect(middleware2).toBeDefined();
    });
  });

  describe('uploadMultiple', () => {
    it('should return a middleware function', () => {
      const middleware = uploadMultiple('images', 5);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create multiple file upload middleware for given field and count', () => {
      const fieldName = 'photos';
      const maxCount = 10;
      const middleware = uploadMultiple(fieldName, maxCount);
      expect(middleware).toBeDefined();
    });

    it('should accept different max counts', () => {
      const middleware1 = uploadMultiple('images', 3);
      const middleware2 = uploadMultiple('images', 10);
      expect(middleware1).toBeDefined();
      expect(middleware2).toBeDefined();
    });
  });

  describe('uploadFields', () => {
    it('should return a middleware function', () => {
      const fields = [
        { name: 'avatar', maxCount: 1 },
        { name: 'photos', maxCount: 5 },
      ];
      const middleware = uploadFields(fields);
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create fields upload middleware for given configuration', () => {
      const fields = [
        { name: 'profile', maxCount: 1 },
        { name: 'gallery', maxCount: 10 },
      ];
      const middleware = uploadFields(fields);
      expect(middleware).toBeDefined();
    });

    it('should handle single field configuration', () => {
      const fields = [{ name: 'image', maxCount: 1 }];
      const middleware = uploadFields(fields);
      expect(middleware).toBeDefined();
    });

    it('should handle multiple field configurations', () => {
      const fields = [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 5 },
        { name: 'documents', maxCount: 3 },
      ];
      const middleware = uploadFields(fields);
      expect(middleware).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should configure fileFilter correctly', () => {
      // We already tested fileFilter extensively above
      expect(fileFilter).toBeDefined();
      expect(typeof fileFilter).toBe('function');
    });

    it('should verify config has maxFileSize defined', () => {
      expect(config.maxFileSize).toBeDefined();
      expect(typeof config.maxFileSize).toBe('number');
      expect(config.maxFileSize).toBeGreaterThan(0);
    });

    it('should verify config has allowedFileTypes defined', () => {
      expect(config.allowedFileTypes).toBeDefined();
      expect(Array.isArray(config.allowedFileTypes)).toBe(true);
      expect(config.allowedFileTypes.length).toBeGreaterThan(0);
    });
  });
});
