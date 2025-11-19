import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  corsOrigin: string;
  maxFileSize: number;
  uploadDir: string;
  allowedFileTypes: string[];
  maxImagesPerRecipe: number;
  storageProvider: 'local' | 's3';
  awsRegion?: string;
  awsS3Bucket?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsEndpoint?: string;
  awsForcePathStyle?: boolean;
  awsCloudfrontUrl?: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  authRateLimitWindowMs: number;
  authRateLimitMaxRequests: number;
}

const config: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://recipeuser:recipepass@localhost:5432/recipedb',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
  maxImagesPerRecipe: parseInt(process.env.MAX_IMAGES_PER_RECIPE || '3', 10),
  storageProvider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3',
  awsRegion: process.env.AWS_REGION,
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsEndpoint: process.env.AWS_ENDPOINT,
  awsForcePathStyle: process.env.AWS_FORCE_PATH_STYLE === 'true',
  awsCloudfrontUrl: process.env.AWS_CLOUDFRONT_URL,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  authRateLimitMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10), // 5 requests per window (production default)
};

export default config;
