# Local Development Environment Configuration
environment = "local"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

# Database Configuration
db_name              = "recipedb"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# ECS Configuration
backend_cpu    = 256
backend_memory = 512
backend_port   = 5000

# Note: Sensitive values (passwords, secrets) should be set via:
# - Environment variables: TF_VAR_db_username, TF_VAR_db_password, etc.
# - Or passed via command line: -var="db_username=value"
# - Or use AWS Secrets Manager / Parameter Store

# Test users are enabled for local environment
test_admin_email    = "admin@recipes.com"
test_member_email   = "member@recipes.com"
