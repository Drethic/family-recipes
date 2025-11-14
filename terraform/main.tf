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

# RDS PostgreSQL Module
module "rds" {
  source = "./modules/rds"

  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
  db_instance_class      = var.db_instance_class
  db_allocated_storage   = var.db_allocated_storage
  ecs_security_group_id  = module.ecs.ecs_security_group_id
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  environment = var.environment
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  public_subnet_ids   = module.vpc.public_subnet_ids

  # Backend configuration
  backend_image       = var.backend_image
  backend_cpu         = var.backend_cpu
  backend_memory      = var.backend_memory
  backend_port        = var.backend_port

  # Secrets ARNs
  secrets_manager_arns = module.secrets.secret_arns

  # Database
  db_endpoint         = module.rds.db_endpoint

  # Load balancer
  alb_target_group_arn = module.alb.target_group_arn
  alb_security_group_id = module.alb.alb_security_group_id

  # S3 bucket for uploads
  uploads_bucket_name = module.s3.uploads_bucket_name
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  backend_port       = var.backend_port

  # SSL certificate (optional)
  certificate_arn    = var.certificate_arn
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment = var.environment
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"

  environment          = var.environment
  frontend_bucket_id   = module.s3.frontend_bucket_id
  frontend_bucket_arn  = module.s3.frontend_bucket_arn
  frontend_bucket_domain_name = module.s3.frontend_bucket_domain_name
  alb_dns_name         = module.alb.alb_dns_name

  # SSL certificate (optional)
  certificate_arn      = var.certificate_arn
}
