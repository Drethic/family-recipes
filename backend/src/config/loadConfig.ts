import dotenv from 'dotenv';
import { secretsManager } from '../utils/secrets';

dotenv.config();

export interface EnvConfig {
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
  awsRegion?: string;
  awsS3Bucket?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

/**
 * Load configuration from AWS Secrets Manager or environment variables
 * Falls back to environment variables if Secrets Manager is unavailable (local dev)
 */
export async function loadConfig(): Promise<EnvConfig> {
  const isAws = !!(
    process.env.AWS_EXECUTION_ENV ||
    process.env.ECS_CONTAINER_METADATA_URI
  );

  console.log(
    `Loading configuration... (AWS: ${isAws}, Environment: ${process.env.NODE_ENV || 'development'})`
  );

  // Try to load secrets from AWS Secrets Manager
  const [dbCredentials, jwtSecrets, appConfig, awsCredentials] =
    await Promise.all([
      secretsManager.getDbCredentials(),
      secretsManager.getJwtSecrets(),
      secretsManager.getAppConfig(),
      secretsManager.getAwsCredentials(),
    ]);

  // Build database URL from credentials or use environment variable
  let databaseUrl: string;
  if (dbCredentials && process.env.DB_HOST) {
    // In ECS, construct URL from secrets and environment
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT || '5432';
    databaseUrl = `postgresql://${dbCredentials.username}:${dbCredentials.password}@${dbHost}:${dbPort}/${dbCredentials.database}`;
  } else if (process.env.DATABASE_URL) {
    // Use environment variable
    databaseUrl = process.env.DATABASE_URL;
  } else {
    // Default for local development
    databaseUrl =
      'postgresql://recipeuser:recipepass@localhost:5432/recipedb';
  }

  const config: EnvConfig = {
    nodeEnv: appConfig?.node_env || process.env.NODE_ENV || 'development',
    port: appConfig?.port || parseInt(process.env.PORT || '5000', 10),
    databaseUrl,
    jwtSecret:
      jwtSecrets?.jwt_secret ||
      process.env.JWT_SECRET ||
      'your-jwt-secret-change-in-production',
    jwtRefreshSecret:
      jwtSecrets?.jwt_refresh_secret ||
      process.env.JWT_REFRESH_SECRET ||
      'your-refresh-secret-change-in-production',
    jwtExpiresIn:
      jwtSecrets?.jwt_expires_in || process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn:
      jwtSecrets?.jwt_refresh_expires_in ||
      process.env.JWT_REFRESH_EXPIRES_IN ||
      '7d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    maxFileSize:
      appConfig?.max_file_size ||
      parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    awsRegion:
      awsCredentials?.aws_region ||
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION,
    awsS3Bucket: process.env.AWS_S3_BUCKET,
    awsAccessKeyId:
      awsCredentials?.aws_access_key_id || process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey:
      awsCredentials?.aws_secret_access_key ||
      process.env.AWS_SECRET_ACCESS_KEY,
    rateLimitWindowMs:
      appConfig?.rate_limit_window_ms ||
      parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests:
      appConfig?.rate_limit_max_requests ||
      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };

  console.log('Configuration loaded successfully');
  console.log(`- Environment: ${config.nodeEnv}`);
  console.log(`- Port: ${config.port}`);
  console.log(`- Database: ${config.databaseUrl.split('@')[1] || 'configured'}`);
  console.log(`- AWS Region: ${config.awsRegion || 'not set'}`);
  console.log(`- S3 Bucket: ${config.awsS3Bucket || 'not set'}`);

  return config;
}

// Singleton instance
let configInstance: EnvConfig | null = null;

/**
 * Get the loaded configuration
 * Must call loadConfig() first during server startup
 */
export function getConfig(): EnvConfig {
  if (!configInstance) {
    throw new Error(
      'Configuration not loaded. Call loadConfig() during server startup.'
    );
  }
  return configInstance;
}

/**
 * Set the configuration instance (called by loadConfig)
 */
export function setConfigInstance(config: EnvConfig): void {
  configInstance = config;
}
