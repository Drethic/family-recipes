output "db_credentials_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "jwt_secrets_arn" {
  description = "ARN of JWT secrets secret"
  value       = aws_secretsmanager_secret.jwt_secrets.arn
}

output "app_config_arn" {
  description = "ARN of application config secret"
  value       = aws_secretsmanager_secret.app_config.arn
}

output "test_users_arn" {
  description = "ARN of test users secret (if enabled)"
  value       = var.test_users_enabled ? aws_secretsmanager_secret.test_users[0].arn : ""
}

output "secret_arns" {
  description = "Map of all secret ARNs"
  value = {
    db_credentials = aws_secretsmanager_secret.db_credentials.arn
    jwt_secrets    = aws_secretsmanager_secret.jwt_secrets.arn
    app_config     = aws_secretsmanager_secret.app_config.arn
    test_users     = var.test_users_enabled ? aws_secretsmanager_secret.test_users[0].arn : ""
    aws_credentials = var.environment != "production" && length(aws_secretsmanager_secret.aws_credentials) > 0 ? aws_secretsmanager_secret.aws_credentials[0].arn : ""
  }
}

output "db_credentials_name" {
  description = "Name of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "jwt_secrets_name" {
  description = "Name of JWT secrets secret"
  value       = aws_secretsmanager_secret.jwt_secrets.name
}

output "app_config_name" {
  description = "Name of application config secret"
  value       = aws_secretsmanager_secret.app_config.name
}
