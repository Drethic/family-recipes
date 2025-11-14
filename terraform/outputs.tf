output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.cloudfront_domain_name
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = module.s3.frontend_bucket_name
}

output "uploads_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = module.s3.uploads_bucket_name
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend"
  value       = module.ecr.backend_repository_url
}

output "secrets_arns" {
  description = "ARNs of secrets in Secrets Manager"
  value       = module.secrets.secret_arns
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}
