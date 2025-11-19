# General Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (local, dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["local", "dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: local, dev, staging, production"
  }
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# Database Variables
variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "recipedb"
}

variable "db_username" {
  description = "Master username for PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_volume_size" {
  description = "Size of EBS volume for PostgreSQL data (GB)"
  type        = number
  default     = 20
}

# JWT Secrets
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

# Test Users (for local/dev environments only)
variable "test_admin_email" {
  description = "Email for test admin user"
  type        = string
  default     = "admin@recipes.com"
}

variable "test_admin_password" {
  description = "Password for test admin user"
  type        = string
  sensitive   = true
  default     = ""
}

variable "test_member_email" {
  description = "Email for test member user"
  type        = string
  default     = "member@recipes.com"
}

variable "test_member_password" {
  description = "Password for test member user"
  type        = string
  sensitive   = true
  default     = ""
}

# EC2 ASG Variables
variable "instance_type" {
  description = "EC2 instance type for application (t4g.micro for maximum cost savings)"
  type        = string
  default     = "t4g.micro"
}

variable "backend_image_tag" {
  description = "Docker image tag for backend (pushed to ECR)"
  type        = string
  default     = "latest"
}

variable "allow_dev_db_destruction" {
  description = "Allow destruction of dev database volume (DANGER: use with extreme caution!)"
  type        = bool
  default     = false
}
