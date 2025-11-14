# terraform/modules/ec2-asg/main.tf
# EC2 Auto Scaling Group with persistent EBS volume for PostgreSQL

locals {
  name_prefix = "family-recipes-${var.environment}"
}

# Data source for latest Amazon Linux 2023 ARM AMI
data "aws_ami" "amazon_linux_2023_arm" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-6.1-arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

# Persistent EBS volume for PostgreSQL data
resource "aws_ebs_volume" "postgres_data" {
  availability_zone = var.availability_zones[0]
  size              = var.db_volume_size
  type              = "gp3"
  encrypted         = true

  # Conditional lifecycle protection
  # Production: ALWAYS protected from deletion
  # Development: Protected UNLESS var.allow_dev_db_destruction = true
  lifecycle {
    prevent_destroy = var.environment == "production" ? true : !var.allow_dev_db_destruction
  }

  tags = {
    Name        = "${local.name_prefix}-postgres-data"
    Environment = var.environment
    Backup      = "daily"
    ManagedBy   = "Terraform"
    Persistent  = "true"
  }
}

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${local.name_prefix}-ec2-role"
    Environment = var.environment
  }
}

# IAM policy for volume management
resource "aws_iam_role_policy" "volume_management" {
  name = "${local.name_prefix}-volume-management"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeVolumes",
          "ec2:DescribeInstances",
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ec2:DescribeVolumeStatus",
          "ec2:DescribeVolumeAttribute"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = "arn:aws:ec2:*:*:volume/*"
      }
    ]
  })
}

# IAM policy for Secrets Manager access
resource "aws_iam_role_policy" "secrets_access" {
  name = "${local.name_prefix}-secrets-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = var.secrets_manager_arns
    }]
  })
}

# IAM policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${local.name_prefix}-cloudwatch-logs"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ]
      Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/ec2/${local.name_prefix}*"
    }]
  })
}

# IAM policy for ECR (to pull Docker images)
resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# IAM policy for SSM Session Manager (for debugging)
resource "aws_iam_role_policy_attachment" "ssm_managed" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM policy for CloudWatch Agent
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name        = "${local.name_prefix}-ec2-profile"
    Environment = var.environment
  }
}

# Security group for EC2 instances
resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app-sg"
  description = "Security group for application instances"
  vpc_id      = var.vpc_id

  # HTTP from anywhere (CloudFront, direct access)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  # HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${local.name_prefix}-app-sg"
    Environment = var.environment
  }
}

# Launch template
resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-"
  image_id      = data.aws_ami.amazon_linux_2023_arm.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  # User data script
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    environment        = var.environment
    aws_region         = var.aws_region
    volume_id          = aws_ebs_volume.postgres_data.id
    db_volume_device   = "/dev/xvdf"
    db_mount_point     = "/var/lib/postgresql/data"
    ecr_repository_url = var.ecr_repository_url
    backend_image_tag  = var.backend_image_tag
  }))

  # Monitoring
  monitoring {
    enabled = true
  }

  # Metadata options (IMDSv2 required for security)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${local.name_prefix}-app"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name        = "${local.name_prefix}-root-volume"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}-asg"
  desired_capacity    = 1
  min_size            = 1
  max_size            = 1
  vpc_zone_identifier = var.public_subnet_ids
  health_check_type   = "EC2"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  # Wait for instance to be healthy
  wait_for_capacity_timeout = "10m"

  # Lifecycle hook for graceful shutdown
  initial_lifecycle_hook {
    name                 = "graceful-shutdown"
    lifecycle_transition = "autoscaling:EC2_INSTANCE_TERMINATING"
    default_result       = "CONTINUE"
    heartbeat_timeout    = 300
  }

  # Instance refresh for zero-downtime updates
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 0
      instance_warmup        = 300
    }
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "Terraform"
    propagate_at_launch = true
  }
}

# Daily snapshots with 3-day retention
resource "aws_dlm_lifecycle_policy" "postgres_snapshots" {
  description        = "Daily snapshots for PostgreSQL data (3-day retention)"
  execution_role_arn = aws_iam_role.dlm_lifecycle_role.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]

    schedule {
      name = "Daily snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }

      retain_rule {
        count = 3
      }

      tags_to_add = {
        SnapshotCreator = "DLM"
        Environment     = var.environment
      }

      copy_tags = true
    }

    target_tags = {
      Backup = "daily"
    }
  }

  tags = {
    Name        = "${local.name_prefix}-snapshot-policy"
    Environment = var.environment
  }
}

# IAM role for DLM
resource "aws_iam_role" "dlm_lifecycle_role" {
  name = "${local.name_prefix}-dlm-lifecycle-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "dlm.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${local.name_prefix}-dlm-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "dlm_lifecycle" {
  name = "${local.name_prefix}-dlm-lifecycle-policy"
  role = aws_iam_role.dlm_lifecycle_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:CreateSnapshots",
          "ec2:DeleteSnapshot",
          "ec2:DescribeVolumes",
          "ec2:DescribeInstances",
          "ec2:DescribeSnapshots"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = "arn:aws:ec2:*::snapshot/*"
      }
    ]
  })
}
