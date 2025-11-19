variable "environment" {
  description = "Environment name"
  type        = string
}

# Database Variables
variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
}

# JWT Variables
variable "jwt_secret" {
  description = "JWT secret for access tokens"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT secret for refresh tokens"
  type        = string
  sensitive   = true
}

# Test User Variables
variable "test_users_enabled" {
  description = "Whether to create test user credentials"
  type        = bool
  default     = false
}

variable "test_admin_email" {
  description = "Test admin email"
  type        = string
  default     = ""
}

variable "test_admin_password" {
  description = "Test admin password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "test_member_email" {
  description = "Test member email"
  type        = string
  default     = ""
}

variable "test_member_password" {
  description = "Test member password"
  type        = string
  sensitive   = true
  default     = ""
}

# AWS Credentials (for local development only)
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key_id" {
  description = "AWS access key ID (local dev only)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS secret access key (local dev only)"
  type        = string
  sensitive   = true
  default     = ""
}
