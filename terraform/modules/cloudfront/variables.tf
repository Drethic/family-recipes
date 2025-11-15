variable "environment" {
  description = "Environment name"
  type        = string
}

variable "frontend_bucket_id" {
  description = "Frontend S3 bucket ID"
  type        = string
}

variable "frontend_bucket_arn" {
  description = "Frontend S3 bucket ARN"
  type        = string
}

variable "frontend_bucket_domain_name" {
  description = "Frontend S3 bucket domain name"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name for backend API"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for custom domain"
  type        = string
  default     = ""
}
