# Database Credentials Secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "family-recipes/${var.environment}/db-credentials"
  description = "Database credentials for Family Recipes ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    database = var.db_name
  })
}

# JWT Secrets
resource "aws_secretsmanager_secret" "jwt_secrets" {
  name        = "family-recipes/${var.environment}/jwt-secrets"
  description = "JWT secrets for Family Recipes ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "jwt_secrets" {
  secret_id = aws_secretsmanager_secret.jwt_secrets.id
  secret_string = jsonencode({
    jwt_secret         = var.jwt_secret
    jwt_refresh_secret = var.jwt_refresh_secret
    jwt_expires_in     = "15m"
    jwt_refresh_expires_in = "7d"
  })
}

# Test Users (only for local/dev environments)
resource "aws_secretsmanager_secret" "test_users" {
  count       = var.test_users_enabled ? 1 : 0
  name        = "family-recipes/${var.environment}/test-users"
  description = "Test user credentials for Family Recipes ${var.environment}"

  recovery_window_in_days = 0  # Immediate deletion for test credentials
}

resource "aws_secretsmanager_secret_version" "test_users" {
  count     = var.test_users_enabled ? 1 : 0
  secret_id = aws_secretsmanager_secret.test_users[0].id
  secret_string = jsonencode({
    admin = {
      email    = var.test_admin_email
      password = var.test_admin_password
      role     = "admin"
    }
    member = {
      email    = var.test_member_email
      password = var.test_member_password
      role     = "member"
    }
  })
}

# Application Configuration (non-sensitive but environment-specific)
resource "aws_secretsmanager_secret" "app_config" {
  name        = "family-recipes/${var.environment}/app-config"
  description = "Application configuration for Family Recipes ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    node_env               = var.environment
    port                   = 5000
    max_file_size          = 5242880  # 5MB
    rate_limit_window_ms   = 900000   # 15 minutes
    rate_limit_max_requests = 100
  })
}

# AWS Credentials for S3 (if needed for local development)
# In production, use IAM roles instead
resource "aws_secretsmanager_secret" "aws_credentials" {
  count       = var.environment != "production" ? 1 : 0
  name        = "family-recipes/${var.environment}/aws-credentials"
  description = "AWS credentials for local development (not used in production)"

  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "aws_credentials" {
  count     = var.environment != "production" ? 1 : 0
  secret_id = aws_secretsmanager_secret.aws_credentials[0].id
  secret_string = jsonencode({
    aws_region            = var.aws_region
    aws_access_key_id     = var.aws_access_key_id != "" ? var.aws_access_key_id : "not-set"
    aws_secret_access_key = var.aws_secret_access_key != "" ? var.aws_secret_access_key : "not-set"
  })
}
