# terraform/modules/ec2-asg/outputs.tf

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "asg_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.arn
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.app.id
}

output "launch_template_latest_version" {
  description = "Latest version of the launch template"
  value       = aws_launch_template.app.latest_version
}

output "postgres_volume_id" {
  description = "ID of the PostgreSQL data EBS volume"
  value       = aws_ebs_volume.postgres_data.id
}

output "postgres_volume_arn" {
  description = "ARN of the PostgreSQL data EBS volume"
  value       = aws_ebs_volume.postgres_data.arn
}

output "security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

output "iam_role_name" {
  description = "Name of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.name
}

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "instance_profile_name" {
  description = "Name of the IAM instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "snapshot_policy_id" {
  description = "ID of the DLM snapshot lifecycle policy"
  value       = aws_dlm_lifecycle_policy.postgres_snapshots.id
}
