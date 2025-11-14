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

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS (GB)"
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

# ECS Variables
variable "backend_image" {
  description = "Docker image for backend (will be built and pushed to ECR)"
  type        = string
  default     = ""
}

variable "backend_cpu" {
  description = "CPU units for backend task"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory (MB) for backend task"
  type        = number
  default     = 512
}

variable "backend_port" {
  description = "Port for backend service"
  type        = number
  default     = 5000
}

# SSL Certificate (optional)
variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}
