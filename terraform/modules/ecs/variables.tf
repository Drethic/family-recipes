variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "backend_image" {
  description = "Docker image for backend"
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

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "enable_autoscaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = false
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 4
}

variable "secrets_manager_arns" {
  description = "Map of Secrets Manager ARNs"
  type        = map(string)
}

variable "db_endpoint" {
  description = "RDS database endpoint"
  type        = string
}

variable "alb_target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "uploads_bucket_name" {
  description = "S3 bucket name for uploads"
  type        = string
}
