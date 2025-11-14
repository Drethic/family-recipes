# Family Recipes - AWS Infrastructure

This directory contains Terraform configuration for deploying the Family Recipes application to AWS.

## Architecture

The infrastructure includes:

- **VPC**: Isolated network with public and private subnets across multiple availability zones
- **RDS PostgreSQL**: Managed database for application data
- **ECS Fargate**: Serverless container orchestration for backend API
- **ECR**: Docker container registry for backend images
- **Application Load Balancer**: Load balancer for backend API
- **S3**: Storage for frontend assets and recipe image uploads
- **CloudFront**: CDN for frontend distribution
- **Secrets Manager**: Secure storage for credentials and secrets
- **CloudWatch**: Logging and monitoring

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **Terraform** v1.5.0 or later
   ```bash
   terraform version
   ```

3. **Docker** for building images
   ```bash
   docker --version
   ```

4. **Node.js** 20+ for building frontend
   ```bash
   node --version
   ```

## Directory Structure

```
terraform/
├── main.tf              # Main Terraform configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── environments/        # Environment-specific configurations
│   ├── local.tfvars
│   └── production.tfvars
└── modules/             # Reusable Terraform modules
    ├── vpc/
    ├── rds/
    ├── ecs/
    ├── ecr/
    ├── alb/
    ├── s3/
    ├── cloudfront/
    └── secrets/
```

## Setup Instructions

### 1. Configure Backend State (Recommended)

First, create an S3 bucket for Terraform state:

```bash
aws s3 mb s3://your-terraform-state-bucket --region us-east-1
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

Update `main.tf` backend configuration:

```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "family-recipes/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-state-lock"
}
```

### 2. Generate Secrets

Generate strong secrets for your environment:

```bash
# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Generate database password
DB_PASSWORD=$(openssl rand -base64 32)

# Save them securely (e.g., in a password manager)
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "DB_PASSWORD=$DB_PASSWORD"
```

### 3. Set Environment Variables

Create a `.env` file (DO NOT commit this):

```bash
# For local/dev environment
export TF_VAR_environment="local"
export TF_VAR_db_username="recipeuser"
export TF_VAR_db_password="YOUR_DB_PASSWORD"
export TF_VAR_jwt_secret="YOUR_JWT_SECRET"
export TF_VAR_jwt_refresh_secret="YOUR_JWT_REFRESH_SECRET"
export TF_VAR_test_admin_password="admin123"
export TF_VAR_test_member_password="member123"
```

Or use a secrets file:

```bash
# Create terraform.tfvars (DO NOT commit)
cat > terraform.tfvars <<EOF
db_username         = "recipeuser"
db_password         = "YOUR_DB_PASSWORD"
jwt_secret          = "YOUR_JWT_SECRET"
jwt_refresh_secret  = "YOUR_JWT_REFRESH_SECRET"
test_admin_password = "admin123"
test_member_password = "member123"
EOF
```

### 4. Initialize Terraform

```bash
cd terraform
terraform init
```

### 5. Plan Deployment

Review what will be created:

```bash
# For local/dev environment
terraform plan -var-file="environments/local.tfvars"

# For production
terraform plan -var-file="environments/production.tfvars"
```

### 6. Deploy Infrastructure

```bash
# For local/dev environment
terraform apply -var-file="environments/local.tfvars"

# For production (requires confirmation)
terraform apply -var-file="environments/production.tfvars"
```

This will take 10-15 minutes to create all resources.

### 7. Save Outputs

After deployment, save important outputs:

```bash
terraform output > ../infrastructure-outputs.txt

# Get specific outputs
echo "ALB URL: $(terraform output -raw alb_dns_name)"
echo "CloudFront URL: $(terraform output -raw cloudfront_domain_name)"
echo "ECR Repository: $(terraform output -raw ecr_backend_repository_url)"
```

## Deployment Scripts

Use the provided scripts for common operations:

### Build and Deploy Backend

```bash
../scripts/deploy-backend.sh <environment>
```

This script will:
1. Build the Docker image for backend
2. Tag and push to ECR
3. Update ECS service to use new image
4. Run database migrations

### Deploy Frontend

```bash
../scripts/deploy-frontend.sh <environment>
```

This script will:
1. Build the frontend for production
2. Sync files to S3
3. Invalidate CloudFront cache

### Initialize Database

```bash
../scripts/init-database.sh <environment>
```

This script will:
1. Run database migrations
2. Run seed data (local/dev only)

## Managing Secrets

### View Secrets (requires AWS permissions)

```bash
aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'family-recipes')].Name"
```

### Update a Secret

```bash
# Update JWT secrets
aws secretsmanager put-secret-value \
  --secret-id family-recipes/local/jwt-secrets \
  --secret-string '{"jwt_secret":"NEW_SECRET","jwt_refresh_secret":"NEW_REFRESH_SECRET","jwt_expires_in":"15m","jwt_refresh_expires_in":"7d"}'
```

### Rotate Database Password

1. Update in Secrets Manager
2. Update RDS instance
3. Restart ECS tasks

## Monitoring

### View Logs

```bash
# Backend logs
aws logs tail /ecs/family-recipes-local-backend --follow

# View specific time range
aws logs tail /ecs/family-recipes-local-backend --since 1h
```

### View Metrics

```bash
# ECS Service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=family-recipes-local-backend-service \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### Access Application

```bash
# Get URLs
ALB_URL=$(terraform output -raw alb_dns_name)
CF_URL=$(terraform output -raw cloudfront_domain_name)

echo "Backend API: http://$ALB_URL/api/health"
echo "Frontend: https://$CF_URL"
```

## Updating Infrastructure

### Modify Resources

1. Edit Terraform files
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes

### Update Backend Configuration

To update backend CPU/memory or other settings:

```bash
# Edit environments/local.tfvars or production.tfvars
vim environments/local.tfvars

# Apply changes
terraform apply -var-file="environments/local.tfvars"
```

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check task status
aws ecs list-tasks --cluster family-recipes-local

# Describe task for errors
aws ecs describe-tasks --cluster family-recipes-local --tasks <task-arn>

# Check logs
aws logs tail /ecs/family-recipes-local-backend --follow
```

### Database Connection Issues

```bash
# Verify RDS endpoint
terraform output rds_endpoint

# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Test from ECS task (exec into container)
aws ecs execute-command --cluster family-recipes-local \
  --task <task-id> \
  --container backend \
  --interactive \
  --command "/bin/sh"
```

### Secrets Not Loading

```bash
# Verify secrets exist
aws secretsmanager list-secrets

# Check IAM permissions
aws iam get-role --role-name family-recipes-local-ecs-task-execution-role

# Verify ECS task definition
aws ecs describe-task-definition --task-definition family-recipes-local-backend
```

## Cleanup

### Destroy Infrastructure

**WARNING**: This will delete ALL resources including databases!

```bash
# Make sure you have backups!
terraform destroy -var-file="environments/local.tfvars"
```

### Partial Cleanup

To keep database but remove compute resources:

```bash
# Target specific resources
terraform destroy -target=module.ecs -var-file="environments/local.tfvars"
terraform destroy -target=module.alb -var-file="environments/local.tfvars"
```

## Cost Optimization

### Development Environment

- Use `db.t3.micro` for RDS (~$15/month)
- Use minimal ECS task size (256 CPU, 512 MB memory)
- Disable NAT Gateways when not in use (costs ~$32/month each)
- Use CloudFront PriceClass_100 (US/Europe only)

### Production Environment

- Use Multi-AZ RDS for high availability
- Enable RDS automated backups
- Use ECS auto-scaling
- Enable CloudFront logging and monitoring
- Set up CloudWatch alarms

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use IAM roles** instead of access keys in AWS
3. **Enable MFA** on AWS root and admin accounts
4. **Rotate secrets** regularly
5. **Enable VPC Flow Logs** for network monitoring
6. **Use private subnets** for databases and backend
7. **Enable encryption** at rest and in transit
8. **Review security groups** regularly
9. **Enable CloudTrail** for audit logging
10. **Use least privilege** IAM policies

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Check AWS service health dashboard
4. Review Terraform plan output carefully before applying

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
