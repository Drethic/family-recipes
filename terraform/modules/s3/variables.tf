variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "ecs_task_role_arn" {
  description = "ARN of ECS task role for S3 access"
  type        = string
  default     = "*"
}
