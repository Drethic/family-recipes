import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'fs/promises';

vi.mock('@aws-sdk/client-s3');
vi.mock('sharp');
vi.mock('fs/promises');
vi.mock('../../config/env', () => ({
  default: {
    storageProvider: 'local',
    uploadDir: '/tmp/uploads',
    publicUrl: 'http://localhost:3000',
    awsRegion: 'us-east-1',
    awsEndpoint: undefined,
    awsAccessKeyId: undefined,
    awsSecretAccessKey: undefined,
    awsS3Bucket: 'test-bucket',
    awsForcePathStyle: false,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5242880,
  },
}));

// Import after mocks are set up
const module = await import('../uploadService');
const uploadService = module.default;

describe('UploadService', () => {
  const mockFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.from('fake-image-data'),
    stream: null as never,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload JPEG image successfully', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      (sharp as never).mockReturnValue(mockSharp);
      (fs.mkdir as never).mockResolvedValue(undefined);
      (fs.writeFile as never).mockResolvedValue(undefined);

      const result = await uploadService.uploadImage(mockFile, 'recipes');

      expect(result).toMatchObject({
        url: expect.stringContaining('http://localhost:3000/uploads/recipes/'),
        filename: expect.stringMatching(/^\d+-[a-f0-9-]+\.jpg$/),
      });
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 85 });
    });

    it('should resize image when dimensions provided', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      (sharp as never).mockReturnValue(mockSharp);
      (fs.mkdir as never).mockResolvedValue(undefined);
      (fs.writeFile as never).mockResolvedValue(undefined);

      await uploadService.uploadImage(mockFile, 'recipes', { width: 800, height: 600 });

      expect(mockSharp.resize).toHaveBeenCalledWith(800, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    it('should handle PNG images', async () => {
      const pngFile = { ...mockFile, mimetype: 'image/png', originalname: 'test.png' };
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      (sharp as never).mockReturnValue(mockSharp);
      (fs.mkdir as never).mockResolvedValue(undefined);
      (fs.writeFile as never).mockResolvedValue(undefined);

      const result = await uploadService.uploadImage(pngFile, 'recipes');

      expect(result.filename).toMatch(/\.png$/);
      expect(mockSharp.png).toHaveBeenCalledWith({ quality: 80 });
    });

    it('should handle WebP images', async () => {
      const webpFile = { ...mockFile, mimetype: 'image/webp', originalname: 'test.webp' };
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      (sharp as never).mockReturnValue(mockSharp);
      (fs.mkdir as never).mockResolvedValue(undefined);
      (fs.writeFile as never).mockResolvedValue(undefined);

      const result = await uploadService.uploadImage(webpFile, 'recipes');

      expect(result.filename).toMatch(/\.webp$/);
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 80 });
    });

    it('should throw error for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(uploadService.uploadImage(invalidFile, 'recipes')).rejects.toThrow(
        'Invalid file type'
      );
    });

    it('should throw error for file exceeding size limit', async () => {
      const largeFile = { ...mockFile, size: 10485760 }; // 10MB

      await expect(uploadService.uploadImage(largeFile, 'recipes')).rejects.toThrow(
        'File size exceeds maximum'
      );
    });

    it('should handle upload errors gracefully', async () => {
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockRejectedValue(new Error('Sharp failed')),
      };
      (sharp as never).mockReturnValue(mockSharp);

      await expect(uploadService.uploadImage(mockFile, 'recipes')).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('should delete image from local storage', async () => {
      (fs.unlink as never).mockResolvedValue(undefined);
      const url = 'http://localhost:3000/uploads/recipes/12345-test.jpg';

      await uploadService.deleteImage(url);

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('uploads/recipes/12345-test.jpg')
      );
    });

    it('should handle delete errors gracefully', async () => {
      (fs.unlink as never).mockRejectedValue(new Error('File not found'));
      const url = 'http://localhost:3000/uploads/recipes/12345-test.jpg';

      // Should not throw
      await expect(uploadService.deleteImage(url)).resolves.toBeUndefined();
    });

    it('should handle invalid URLs gracefully', async () => {
      const url = 'not-a-valid-url';

      await expect(uploadService.deleteImage(url)).resolves.toBeUndefined();
    });

    it('should handle empty URLs gracefully', async () => {
      await expect(uploadService.deleteImage('')).resolves.toBeUndefined();
    });
  });

  describe('deleteMultipleImages', () => {
    it('should delete multiple images', async () => {
      (fs.unlink as never).mockResolvedValue(undefined);
      const urls = [
        'http://localhost:3000/uploads/recipes/1-test.jpg',
        'http://localhost:3000/uploads/recipes/2-test.jpg',
      ];

      await uploadService.deleteMultipleImages(urls);

      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should handle empty array', async () => {
      await expect(uploadService.deleteMultipleImages([])).resolves.toBeUndefined();
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it('should continue deleting even if some fail', async () => {
      (fs.unlink as never)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(undefined);

      const urls = [
        'http://localhost:3000/uploads/recipes/1-test.jpg',
        'http://localhost:3000/uploads/recipes/2-test.jpg',
        'http://localhost:3000/uploads/recipes/3-test.jpg',
      ];

      await expect(uploadService.deleteMultipleImages(urls)).resolves.toBeUndefined();
    });
  });
});
