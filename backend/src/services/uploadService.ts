import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import config from '../config/env';

interface UploadResult {
  url: string;
  filename: string;
}

interface ImageDimensions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

class UploadService {
  private s3Client: S3Client | null = null;

  constructor() {
    if (config.storageProvider === 's3' && this.validateS3Config()) {
      this.s3Client = new S3Client({
        region: config.awsRegion,
        credentials: config.awsAccessKeyId && config.awsSecretAccessKey
          ? {
              accessKeyId: config.awsAccessKeyId,
              secretAccessKey: config.awsSecretAccessKey,
            }
          : undefined,
        endpoint: config.awsEndpoint,
        forcePathStyle: config.awsForcePathStyle,
      });
    } else if (config.storageProvider === 's3') {
      throw new Error('S3 storage provider selected but configuration is incomplete');
    }
  }

  private validateS3Config(): boolean {
    return !!(
      config.awsRegion &&
      config.awsS3Bucket &&
      config.awsAccessKeyId &&
      config.awsSecretAccessKey
    );
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(config.uploadDir);
    } catch {
      await fs.mkdir(config.uploadDir, { recursive: true });
    }
  }

  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4();
    return `${timestamp}-${uuid}${ext}`;
  }

  private async optimizeImage(
    buffer: Buffer,
    mimetype: string,
    dimensions?: ImageDimensions
  ): Promise<Buffer> {
    let image = sharp(buffer);

    // Resize if dimensions provided
    if (dimensions) {
      image = image.resize({
        width: dimensions.width,
        height: dimensions.height,
        fit: dimensions.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Convert to appropriate format with compression
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      return image.jpeg({ quality: 85, progressive: true }).toBuffer();
    } else if (mimetype === 'image/png') {
      return image.png({ compressionLevel: 9 }).toBuffer();
    } else if (mimetype === 'image/webp') {
      return image.webp({ quality: 85 }).toBuffer();
    }

    // Default: return original buffer
    return buffer;
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'recipes',
    dimensions?: ImageDimensions
  ): Promise<UploadResult> {
    // Validate file type
    if (!config.allowedFileTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${config.allowedFileTypes.join(', ')}`
      );
    }

    // Validate file size
    if (file.size > config.maxFileSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.maxFileSize} bytes`
      );
    }

    const filename = this.generateFilename(file.originalname);
    const filePath = `${folder}/${filename}`;

    // Optimize image
    const optimizedBuffer = await this.optimizeImage(
      file.buffer,
      file.mimetype,
      dimensions
    );

    if (config.storageProvider === 's3' && this.s3Client) {
      return this.uploadToS3(optimizedBuffer, filePath, file.mimetype);
    } else {
      return this.uploadToLocal(optimizedBuffer, filePath);
    }
  }

  private async uploadToS3(
    buffer: Buffer,
    filePath: string,
    mimetype: string
  ): Promise<UploadResult> {
    if (!this.s3Client || !config.awsS3Bucket) {
      throw new Error('S3 client not initialized');
    }

    const command = new PutObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: filePath,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    // Generate URL
    const url = config.awsCloudfrontUrl
      ? `${config.awsCloudfrontUrl}/${filePath}`
      : config.awsEndpoint
      ? `${config.awsEndpoint}/${config.awsS3Bucket}/${filePath}`
      : `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${filePath}`;

    return {
      url,
      filename: path.basename(filePath),
    };
  }

  private async uploadToLocal(
    buffer: Buffer,
    filePath: string
  ): Promise<UploadResult> {
    await this.ensureUploadDir();

    const fullPath = path.join(config.uploadDir, filePath);
    const dir = path.dirname(fullPath);

    // Ensure subdirectory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, buffer);

    // Return relative URL for serving via Express static middleware
    return {
      url: `/uploads/${filePath}`,
      filename: path.basename(filePath),
    };
  }

  async deleteImage(url: string): Promise<void> {
    if (config.storageProvider === 's3' && this.s3Client) {
      await this.deleteFromS3(url);
    } else {
      await this.deleteFromLocal(url);
    }
  }

  private async deleteFromS3(url: string): Promise<void> {
    if (!this.s3Client || !config.awsS3Bucket) {
      throw new Error('S3 client not initialized');
    }

    // Extract key from URL
    let key: string;
    if (config.awsCloudfrontUrl && url.startsWith(config.awsCloudfrontUrl)) {
      key = url.replace(`${config.awsCloudfrontUrl}/`, '');
    } else if (config.awsEndpoint && url.startsWith(config.awsEndpoint)) {
      const parts = url.split('/');
      key = parts.slice(parts.indexOf(config.awsS3Bucket) + 1).join('/');
    } else {
      // AWS S3 standard URL
      const urlParts = url.split('.amazonaws.com/');
      key = urlParts[1] || url;
    }

    const command = new DeleteObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  private async deleteFromLocal(url: string): Promise<void> {
    // Extract file path from URL (remove /uploads prefix)
    const relativePath = url.replace('/uploads/', '');
    const fullPath = path.join(config.uploadDir, relativePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async deleteMultipleImages(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.deleteImage(url)));
  }
}

export default new UploadService();
