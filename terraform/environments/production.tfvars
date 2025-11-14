# Production Environment Configuration
environment = "production"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]

# Database Configuration (Production sizing)
db_name        = "recipedb"
db_volume_size = 30  # GB for PostgreSQL data volume (larger for production)

# EC2 ASG Configuration
instance_type = "t4g.micro"  # Cost-optimized even for production (10-20 users)
backend_image_tag = "latest"

# Production database is ALWAYS protected from destruction
# The allow_dev_db_destruction variable has no effect on production

# Note: All sensitive values MUST be set via environment variables or AWS Secrets Manager
# Never commit production credentials to version control

# Test users are DISABLED for production
# Real users will be created through the application
