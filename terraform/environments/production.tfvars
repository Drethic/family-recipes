# Production Environment Configuration
environment = "production"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]

# Database Configuration (Production sizing)
db_name              = "recipedb"
db_instance_class    = "db.t3.small"  # Upgrade for production
db_allocated_storage = 100

# ECS Configuration (Production sizing)
backend_cpu    = 512
backend_memory = 1024
backend_port   = 5000

# Note: All sensitive values MUST be set via environment variables or AWS Secrets Manager
# Never commit production credentials to version control

# Test users are DISABLED for production
# Real users will be created through the application
