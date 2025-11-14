output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = module.ec2_asg.asg_name
}

output "postgres_volume_id" {
  description = "PostgreSQL data EBS volume ID"
  value       = module.ec2_asg.postgres_volume_id
}

output "uploads_bucket_name" {
  description = "S3 bucket name for recipe image uploads"
  value       = module.s3.uploads_bucket_name
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend Docker images"
  value       = module.ecr.backend_repository_url
}

output "secrets_arns" {
  description = "ARNs of secrets in Secrets Manager"
  value       = module.secrets.secret_arns
  sensitive   = true
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = module.ec2_asg.security_group_id
}

output "snapshot_policy_id" {
  description = "DLM snapshot lifecycle policy ID"
  value       = module.ec2_asg.snapshot_policy_id
}
