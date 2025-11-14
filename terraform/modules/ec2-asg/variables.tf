# terraform/modules/ec2-asg/variables.tf

variable "environment" {
  description = "Environment name (local, production)"
  type        = string
  validation {
    condition     = contains(["local", "production"], var.environment)
    error_message = "Environment must be either 'local' or 'production'."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for EC2 instances"
  type        = list(string)
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type (t4g.micro recommended for cost savings)"
  type        = string
  default     = "t4g.micro"
}

variable "db_volume_size" {
  description = "Size of PostgreSQL data volume in GB"
  type        = number
  default     = 20
  validation {
    condition     = var.db_volume_size >= 8 && var.db_volume_size <= 1000
    error_message = "Database volume size must be between 8 and 1000 GB."
  }
}

variable "allow_dev_db_destruction" {
  description = "Allow destruction of development database (DANGER: use with caution!)"
  type        = bool
  default     = false
}

variable "ecr_repository_url" {
  description = "ECR repository URL for backend Docker image"
  type        = string
}

variable "backend_image_tag" {
  description = "Backend Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "secrets_manager_arns" {
  description = "List of Secrets Manager secret ARNs that EC2 needs access to"
  type        = list(string)
  default     = []
}
