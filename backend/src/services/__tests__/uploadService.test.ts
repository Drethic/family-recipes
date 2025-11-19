import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Client as _S3Client } from '@aws-sdk/client-s3';
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

describe('UploadService', () => {
  let uploadService: typeof import('../uploadService').default;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../uploadService');
    uploadService = module.default;
  });
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
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await uploadService.uploadImage(mockFile, 'recipes');

      expect(result).toMatchObject({
        url: expect.stringContaining('/uploads/recipes/'),
        filename: expect.stringMatching(/^\d+-[a-f0-9-]+\.jpg$/),
      });
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 85, progressive: true });
    });

    it('should resize image when dimensions provided', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await uploadService.uploadImage(mockFile, 'recipes', { width: 800, height: 600 });

      expect(mockSharp.resize).toHaveBeenCalledWith({
        width: 800,
        height: 600,
        fit: 'cover',
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
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await uploadService.uploadImage(pngFile, 'recipes');

      expect(result.filename).toMatch(/\.png$/);
      expect(mockSharp.png).toHaveBeenCalledWith({ compressionLevel: 9 });
    });

    it('should handle WebP images', async () => {
      const webpFile = { ...mockFile, mimetype: 'image/webp', originalname: 'test.webp' };
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await uploadService.uploadImage(webpFile, 'recipes');

      expect(result.filename).toMatch(/\.webp$/);
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 85 });
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
      vi.mocked(sharp).mockReturnValue(mockSharp as never);

      await expect(uploadService.uploadImage(mockFile, 'recipes')).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('should delete image from local storage', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      const url = '/uploads/recipes/12345-test.jpg';

      await uploadService.deleteImage(url);

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('uploads/recipes/12345-test.jpg')
      );
    });

    it('should handle ENOENT errors gracefully', async () => {
      const enoentError = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      vi.mocked(fs.unlink).mockRejectedValue(enoentError);
      const url = '/uploads/recipes/12345-test.jpg';

      // Should not throw for ENOENT errors
      await expect(uploadService.deleteImage(url)).resolves.toBeUndefined();
    });

    it('should handle invalid URLs gracefully', async () => {
      const enoentError = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      vi.mocked(fs.unlink).mockRejectedValue(enoentError);
      const url = 'not-a-valid-url';

      await expect(uploadService.deleteImage(url)).resolves.toBeUndefined();
    });

    it('should handle empty URLs gracefully', async () => {
      const enoentError = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      vi.mocked(fs.unlink).mockRejectedValue(enoentError);

      await expect(uploadService.deleteImage('')).resolves.toBeUndefined();
    });
  });

  describe('deleteMultipleImages', () => {
    it('should delete multiple images', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      const urls = [
        '/uploads/recipes/1-test.jpg',
        '/uploads/recipes/2-test.jpg',
      ];

      await uploadService.deleteMultipleImages(urls);

      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should handle empty array', async () => {
      await expect(uploadService.deleteMultipleImages([])).resolves.toBeUndefined();
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it('should continue deleting even if some fail with ENOENT', async () => {
      const enoentError = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      vi.mocked(fs.unlink)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(enoentError)
        .mockResolvedValueOnce(undefined);

      const urls = [
        '/uploads/recipes/1-test.jpg',
        '/uploads/recipes/2-test.jpg',
        '/uploads/recipes/3-test.jpg',
      ];

      await expect(uploadService.deleteMultipleImages(urls)).resolves.toBeUndefined();
    });
  });

  describe('ensureUploadDir', () => {
    it('should create upload directory when it does not exist', async () => {
      const accessError = new Error('ENOENT');
      vi.mocked(fs.access).mockRejectedValue(accessError);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);

      await uploadService.uploadImage(mockFile, 'recipes');

      expect(fs.access).toHaveBeenCalled();
      expect(fs.mkdir).toHaveBeenCalledWith('/tmp/uploads', { recursive: true });
    });
  });

  describe('optimizeImage', () => {
    it('should handle custom fit parameter', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await uploadService.uploadImage(mockFile, 'recipes', {
        width: 800,
        height: 600,
        fit: 'contain',
      });

      expect(mockSharp.resize).toHaveBeenCalledWith({
        width: 800,
        height: 600,
        fit: 'contain',
        withoutEnlargement: true,
      });
    });

    it('should optimize without dimensions', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await uploadService.uploadImage(mockFile, 'recipes');

      // resize should not be called when no dimensions provided
      expect(mockSharp.jpeg).toHaveBeenCalled();
    });

    it('should return original buffer for unknown image type', async () => {
      // Use image/gif which is in allowedFileTypes for testing, but not optimized
      const gifFile = { ...mockFile, mimetype: 'image/gif', originalname: 'test.gif' };

      // Mock config to allow image/gif
      vi.doMock('../../config/env', () => ({
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
          allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maxFileSize: 5242880,
        },
      }));

      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      vi.resetModules();
      const module = await import('../uploadService');
      const gifService = module.default;

      await gifService.uploadImage(gifFile, 'recipes');

      // For unknown image types, sharp is created but no format method is called
      // The original buffer is returned and written
      expect(sharp).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), gifFile.buffer);
    });
  });

  describe('deleteImage with errors', () => {
    it('should throw non-ENOENT errors', async () => {
      const otherError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
      vi.mocked(fs.unlink).mockRejectedValue(otherError);
      const url = '/uploads/recipes/12345-test.jpg';

      await expect(uploadService.deleteImage(url)).rejects.toThrow('Permission denied');
    });
  });
});

describe('UploadService - S3 Storage', () => {
  let S3UploadService: typeof import('../uploadService').default;
  const mockS3Send = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock S3Client as a class constructor
    vi.mocked(_S3Client).mockImplementation(function (this: { send: typeof mockS3Send }) {
      this.send = mockS3Send;
      return this;
    } as never);

    // Mock config for S3
    vi.doMock('../../config/env', () => ({
      default: {
        storageProvider: 's3',
        uploadDir: '/tmp/uploads',
        publicUrl: 'http://localhost:3000',
        awsRegion: 'us-east-1',
        awsEndpoint: 'https://s3.amazonaws.com',
        awsAccessKeyId: 'test-key',
        awsSecretAccessKey: 'test-secret',
        awsS3Bucket: 'test-bucket',
        awsCloudfrontUrl: '',
        awsForcePathStyle: false,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSize: 5242880,
      },
    }));

    // Re-import module with S3 config
    vi.resetModules();
    const module = await import('../uploadService');
    S3UploadService = module.default;
  });

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

  describe('uploadImage to S3', () => {
    it('should upload image to S3 successfully', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      mockS3Send.mockResolvedValue({});

      const result = await S3UploadService.uploadImage(mockFile, 'recipes');

      expect(mockS3Send).toHaveBeenCalled();
      expect(result).toMatchObject({
        url: expect.stringContaining('test-bucket'),
        filename: expect.stringMatching(/^\d+-[a-f0-9-]+\.jpg$/),
      });
    });

    it('should generate CloudFront URL when configured', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      mockS3Send.mockResolvedValue({});

      // Mock config with CloudFront URL
      vi.doMock('../../config/env', () => ({
        default: {
          storageProvider: 's3',
          uploadDir: '/tmp/uploads',
          publicUrl: 'http://localhost:3000',
          awsRegion: 'us-east-1',
          awsEndpoint: 'https://s3.amazonaws.com',
          awsAccessKeyId: 'test-key',
          awsSecretAccessKey: 'test-secret',
          awsS3Bucket: 'test-bucket',
          awsCloudfrontUrl: 'https://cdn.example.com',
          awsForcePathStyle: false,
          allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maxFileSize: 5242880,
        },
      }));

      vi.resetModules();
      const module = await import('../uploadService');
      const CloudFrontService = module.default;

      const result = await CloudFrontService.uploadImage(mockFile, 'recipes');

      expect(result.url).toContain('cdn.example.com');
    });

    it('should handle S3 upload errors', async () => {
      const mockBuffer = Buffer.from('optimized-image');
      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as never);
      mockS3Send.mockRejectedValue(new Error('S3 upload failed'));

      await expect(S3UploadService.uploadImage(mockFile, 'recipes')).rejects.toThrow(
        'S3 upload failed'
      );
    });
  });

  describe('deleteImage from S3', () => {
    it('should delete image from S3 with CloudFront URL', async () => {
      mockS3Send.mockResolvedValue({});

      // Mock config with CloudFront URL for this test
      vi.doMock('../../config/env', () => ({
        default: {
          storageProvider: 's3',
          uploadDir: '/tmp/uploads',
          publicUrl: 'http://localhost:3000',
          awsRegion: 'us-east-1',
          awsEndpoint: 'https://s3.amazonaws.com',
          awsAccessKeyId: 'test-key',
          awsSecretAccessKey: 'test-secret',
          awsS3Bucket: 'test-bucket',
          awsCloudfrontUrl: 'https://cdn.example.com',
          awsForcePathStyle: false,
          allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maxFileSize: 5242880,
        },
      }));

      vi.resetModules();
      const module = await import('../uploadService');
      const CloudFrontService = module.default;

      await CloudFrontService.deleteImage('https://cdn.example.com/recipes/test.jpg');

      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should delete image from S3 with endpoint URL', async () => {
      mockS3Send.mockResolvedValue({});

      await S3UploadService.deleteImage('https://s3.amazonaws.com/test-bucket/recipes/test.jpg');

      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should delete image from S3 with standard AWS URL', async () => {
      mockS3Send.mockResolvedValue({});

      await S3UploadService.deleteImage(
        'https://test-bucket.s3.us-east-1.amazonaws.com/recipes/test.jpg'
      );

      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should handle S3 delete errors', async () => {
      mockS3Send.mockRejectedValue(new Error('S3 delete failed'));

      await expect(
        S3UploadService.deleteImage('https://cdn.example.com/recipes/test.jpg')
      ).rejects.toThrow('S3 delete failed');
    });
  });

  describe('deleteMultipleImages from S3', () => {
    it('should delete multiple images from S3', async () => {
      mockS3Send.mockResolvedValue({});

      const urls = [
        'https://cdn.example.com/recipes/1-test.jpg',
        'https://cdn.example.com/recipes/2-test.jpg',
      ];

      await S3UploadService.deleteMultipleImages(urls);

      expect(mockS3Send).toHaveBeenCalledTimes(2);
    });
  });
});

describe('UploadService - S3 Configuration Errors', () => {
  it('should throw error when S3 selected but config incomplete', async () => {
    vi.clearAllMocks();

    // Mock incomplete S3 config
    vi.doMock('../../config/env', () => ({
      default: {
        storageProvider: 's3',
        uploadDir: '/tmp/uploads',
        publicUrl: 'http://localhost:3000',
        awsRegion: '',  // Missing region
        awsEndpoint: undefined,
        awsAccessKeyId: undefined,  // Missing credentials
        awsSecretAccessKey: undefined,
        awsS3Bucket: '',  // Missing bucket
        awsCloudfrontUrl: '',
        awsForcePathStyle: false,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSize: 5242880,
      },
    }));

    vi.resetModules();

    await expect(async () => {
      await import('../uploadService');
    }).rejects.toThrow('S3 storage provider selected but configuration is incomplete');
  });
});
