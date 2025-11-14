terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    # Configure this with your own S3 bucket for state storage
    # bucket         = "your-terraform-state-bucket"
    # key            = "family-recipes/terraform.tfstate"
    # region         = "us-east-1"
    # encrypt        = true
    # dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Family Recipes"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"

  environment = var.environment

  # Database secrets
  db_username = var.db_username
  db_password = var.db_password
  db_name     = var.db_name

  # JWT secrets
  jwt_secret         = var.jwt_secret
  jwt_refresh_secret = var.jwt_refresh_secret

  # Test users (only for local/dev)
  test_users_enabled = var.environment != "production"
  test_admin_email   = var.test_admin_email
  test_admin_password = var.test_admin_password
  test_member_email  = var.test_member_email
  test_member_password = var.test_member_password
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  environment = var.environment
}

# EC2 Auto Scaling Group Module (replaces RDS + ECS + ALB)
module "ec2_asg" {
  source = "./modules/ec2-asg"

  environment          = var.environment
  aws_region           = var.aws_region
  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids
  availability_zones   = var.availability_zones

  # Instance configuration
  instance_type        = var.instance_type
  db_volume_size       = var.db_volume_size

  # Database destruction control
  allow_dev_db_destruction = var.allow_dev_db_destruction

  # ECR repository
  ecr_repository_url   = module.ecr.repository_url
  backend_image_tag    = var.backend_image_tag

  # Secrets Manager access
  secrets_manager_arns = module.secrets.secret_arns
}

# S3 Module (for uploads only, frontend uses Amplify)
module "s3" {
  source = "./modules/s3"

  environment = var.environment
}
