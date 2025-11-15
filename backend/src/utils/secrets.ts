import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface DbCredentials {
  username: string;
  password: string;
  database: string;
}

interface JwtSecrets {
  jwt_secret: string;
  jwt_refresh_secret: string;
  jwt_expires_in: string;
  jwt_refresh_expires_in: string;
}

interface AppConfig {
  node_env: string;
  port: number;
  max_file_size: number;
  rate_limit_window_ms: number;
  rate_limit_max_requests: number;
}

interface TestUsers {
  admin: {
    email: string;
    password: string;
    role: string;
  };
  member: {
    email: string;
    password: string;
    role: string;
  };
}

interface AwsCredentials {
  aws_region: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
}

class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, unknown> = new Map();
  private isAws: boolean;

  constructor() {
    // Check if running in AWS (ECS provides these environment variables)
    this.isAws = !!(
      process.env.AWS_EXECUTION_ENV ||
      process.env.ECS_CONTAINER_METADATA_URI
    );

    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  private async getSecret<T>(secretName: string): Promise<T | null> {
    // Return cached value if available
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName) as T;
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);

      if (!response.SecretString) {
        console.warn(`Secret ${secretName} has no value`);
        return null;
      }

      const secret = JSON.parse(response.SecretString) as T;
      this.cache.set(secretName, secret);
      return secret;
    } catch (error) {
      if (this.isAws) {
        // In AWS, throw error if secret not found
        console.error(`Failed to retrieve secret ${secretName}:`, error);
        throw new Error(`Failed to retrieve secret ${secretName}`);
      } else {
        // In local dev, return null and fall back to env vars
        console.warn(
          `Failed to retrieve secret ${secretName}, falling back to environment variables`
        );
        return null;
      }
    }
  }

  async getDbCredentials(): Promise<DbCredentials | null> {
    const environment = process.env.NODE_ENV || 'development';
    const secretName = `family-recipes/${environment}/db-credentials`;
    return this.getSecret<DbCredentials>(secretName);
  }

  async getJwtSecrets(): Promise<JwtSecrets | null> {
    const environment = process.env.NODE_ENV || 'development';
    const secretName = `family-recipes/${environment}/jwt-secrets`;
    return this.getSecret<JwtSecrets>(secretName);
  }

  async getAppConfig(): Promise<AppConfig | null> {
    const environment = process.env.NODE_ENV || 'development';
    const secretName = `family-recipes/${environment}/app-config`;
    return this.getSecret<AppConfig>(secretName);
  }

  async getTestUsers(): Promise<TestUsers | null> {
    const environment = process.env.NODE_ENV || 'development';
    if (environment === 'production') {
      return null; // No test users in production
    }
    const secretName = `family-recipes/${environment}/test-users`;
    return this.getSecret<TestUsers>(secretName);
  }

  async getAwsCredentials(): Promise<AwsCredentials | null> {
    const environment = process.env.NODE_ENV || 'development';
    if (environment === 'production') {
      return null; // Use IAM roles in production
    }
    const secretName = `family-recipes/${environment}/aws-credentials`;
    return this.getSecret<AwsCredentials>(secretName);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const secretsManager = new SecretsManager();
export type { DbCredentials, JwtSecrets, AppConfig, TestUsers, AwsCredentials };
