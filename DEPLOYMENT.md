# Family Recipes - AWS Deployment Guide

This guide walks you through deploying the Family Recipes application to AWS using Terraform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment](#post-deployment)
- [Managing the Application](#managing-the-application)
- [Troubleshooting](#troubleshooting)
- [Cost Estimates](#cost-estimates)

## Overview

The application is deployed using:

- **Infrastructure**: AWS (ECS, RDS, S3, CloudFront, ALB)
- **Infrastructure as Code**: Terraform
- **Container Orchestration**: ECS Fargate
- **Database**: RDS PostgreSQL
- **Frontend Hosting**: S3 + CloudFront
- **Secrets Management**: AWS Secrets Manager

## Prerequisites

### Required Software

1. **AWS CLI** (v2+)
   ```bash
   # Install on macOS
   brew install awscli

   # Install on Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Verify installation
   aws --version
   ```

2. **Terraform** (v1.5+)
   ```bash
   # Install on macOS
   brew install terraform

   # Install on Linux
   wget https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip
   unzip terraform_1.7.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/

   # Verify installation
   terraform version
   ```

3. **Docker** (v20+)
   ```bash
   # Follow instructions at https://docs.docker.com/get-docker/
   docker --version
   ```

4. **Node.js** (v20+)
   ```bash
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20

   # Verify installation
   node --version
   npm --version
   ```

### AWS Account Setup

1. **Create an AWS Account** (if you don't have one)
   - Visit https://aws.amazon.com/
   - Note: You'll need a credit card for verification

2. **Create an IAM User for Deployments**
   ```bash
   # Via AWS Console:
   # 1. Go to IAM → Users → Add User
   # 2. User name: terraform-deploy
   # 3. Access type: Programmatic access
   # 4. Attach policies:
   #    - AmazonEC2ContainerRegistryFullAccess
   #    - AmazonECS_FullAccess
   #    - AmazonS3FullAccess
   #    - AmazonRDSFullAccess
   #    - CloudFrontFullAccess
   #    - SecretsManagerReadWrite
   #    - IAMFullAccess (or create custom policy)
   #    - CloudWatchLogsFullAccess
   # 5. Save the Access Key ID and Secret Access Key
   ```

3. **Configure AWS CLI**
   ```bash
   aws configure
   # AWS Access Key ID: [your-access-key]
   # AWS Secret Access Key: [your-secret-key]
   # Default region name: us-east-1
   # Default output format: json

   # Verify configuration
   aws sts get-caller-identity
   ```

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/family-recipes.git
cd family-recipes
```

### 2. Generate Secrets

```bash
./scripts/generate-secrets.sh local
```

This will:
- Generate strong random passwords and secrets
- Optionally create `terraform/terraform.tfvars`
- Display values for manual entry

**IMPORTANT**: Save these secrets securely (e.g., in a password manager). You'll need them for both Terraform and runtime configuration.

### 3. Review and Customize Configuration

Edit `terraform/environments/local.tfvars` or `terraform/environments/production.tfvars`:

```hcl
# Environment name
environment = "local"  # or "production"

# AWS region
aws_region = "us-east-1"

# Database configuration
db_instance_class    = "db.t3.micro"  # Upgrade for production
db_allocated_storage = 20             # Increase for production

# ECS configuration
backend_cpu    = 256   # Upgrade for production (512, 1024, 2048, 4096)
backend_memory = 512   # Upgrade for production (1024, 2048, 4096, 8192)

# SSL Certificate (optional)
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/..."
```

### 4. Set Up Terraform Backend (Recommended)

Store Terraform state remotely for team collaboration:

```bash
# Create S3 bucket for state
BUCKET_NAME="your-terraform-state-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Update terraform/main.tf backend configuration
# Uncomment and update the backend "s3" block with your bucket name
```

## Deployment Steps

### Step 1: Initialize Terraform

```bash
cd terraform
terraform init
```

Expected output:
```
Initializing modules...
Initializing the backend...
Initializing provider plugins...
Terraform has been successfully initialized!
```

### Step 2: Validate Configuration

```bash
terraform validate
```

Expected output:
```
Success! The configuration is valid.
```

### Step 3: Plan Deployment

```bash
# For local/dev environment
terraform plan -var-file="environments/local.tfvars"

# Review the plan carefully!
# It will show ~50-60 resources to be created
```

### Step 4: Apply Infrastructure

```bash
# Deploy infrastructure
terraform apply -var-file="environments/local.tfvars"

# Type 'yes' when prompted
```

This will take **10-15 minutes** to complete. Terraform will create:
- VPC with public/private subnets
- RDS PostgreSQL database
- ECS cluster
- ECR repository
- Application Load Balancer
- S3 buckets
- CloudFront distribution
- Secrets Manager secrets
- IAM roles and security groups

### Step 5: Save Infrastructure Outputs

```bash
# Save all outputs
terraform output > ../infrastructure-outputs.txt

# View specific outputs
terraform output alb_dns_name
terraform output cloudfront_domain_name
terraform output ecr_backend_repository_url
```

### Step 6: Deploy Backend

```bash
cd ..
./scripts/deploy-backend.sh local
```

This will:
1. Build Docker image for backend
2. Push to ECR
3. Deploy to ECS
4. Run database migrations
5. Run seeds (for non-production environments)

### Step 7: Deploy Frontend

```bash
./scripts/deploy-frontend.sh local
```

This will:
1. Build frontend for production
2. Upload to S3
3. Invalidate CloudFront cache

### Step 8: Verify Deployment

```bash
./scripts/check-health.sh local
```

Expected output:
```
✓ Backend is healthy (HTTP 200)
✓ Frontend is accessible (HTTP 200)
✓ ECS service is stable (1/1 tasks)
✓ Database is available
```

## Post-Deployment

### Access Your Application

```bash
# Get URLs
cd terraform
FRONTEND_URL=$(terraform output -raw cloudfront_domain_name)
BACKEND_URL=$(terraform output -raw alb_dns_name)

echo "Frontend: https://$FRONTEND_URL"
echo "Backend API: http://$BACKEND_URL/api"
```

### Test the Application

1. **Open Frontend**: Visit the CloudFront URL
2. **Test Login** (local/dev only):
   - Admin: `admin@recipes.com` / `admin123`
   - Member: `member@recipes.com` / `member123`
3. **Create a Recipe**: Test the full workflow
4. **Upload an Image**: Verify S3 integration

### Set Up Custom Domain (Optional)

1. **Get SSL Certificate from ACM**:
   ```bash
   aws acm request-certificate \
     --domain-name recipes.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Verify Domain Ownership**:
   - Add DNS records as instructed by ACM
   - Wait for certificate validation

3. **Update Terraform Configuration**:
   ```bash
   # In terraform/terraform.tfvars or environments/*.tfvars
   certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/..."

   # Redeploy
   terraform apply -var-file="environments/local.tfvars"
   ```

4. **Update DNS**:
   ```bash
   # Create CNAME record
   # Name: recipes
   # Value: [cloudfront-domain-name]
   ```

## Managing the Application

### View Logs

```bash
# Backend logs (real-time)
aws logs tail /ecs/family-recipes-local-backend --follow

# Backend logs (last hour)
aws logs tail /ecs/family-recipes-local-backend --since 1h

# View all log groups
aws logs describe-log-groups --log-group-name-prefix /ecs/family-recipes
```

### Update Backend

```bash
# Make code changes
# Then redeploy
./scripts/deploy-backend.sh local
```

### Update Frontend

```bash
# Make code changes
# Then redeploy
./scripts/deploy-frontend.sh local
```

### Run Database Migrations

```bash
# SSH into ECS task
./scripts/run-migrations.sh local
```

### Scale ECS Service

```bash
# Via Terraform
# Edit terraform/environments/local.tfvars:
# desired_count = 2

# Apply changes
cd terraform
terraform apply -var-file="environments/local.tfvars"

# Or via AWS CLI
aws ecs update-service \
  --cluster family-recipes-local \
  --service family-recipes-local-backend-service \
  --desired-count 2
```

### Update Secrets

```bash
# Update JWT secrets
aws secretsmanager put-secret-value \
  --secret-id family-recipes/local/jwt-secrets \
  --secret-string '{"jwt_secret":"NEW_SECRET","jwt_refresh_secret":"NEW_REFRESH_SECRET","jwt_expires_in":"15m","jwt_refresh_expires_in":"7d"}'

# Restart ECS tasks to pick up new secrets
aws ecs update-service \
  --cluster family-recipes-local \
  --service family-recipes-local-backend-service \
  --force-new-deployment
```

## Troubleshooting

### Backend Not Starting

1. **Check ECS Task Logs**:
   ```bash
   aws logs tail /ecs/family-recipes-local-backend --follow
   ```

2. **Check Task Status**:
   ```bash
   aws ecs describe-tasks \
     --cluster family-recipes-local \
     --tasks $(aws ecs list-tasks --cluster family-recipes-local --query 'taskArns[0]' --output text)
   ```

3. **Common Issues**:
   - Database connection timeout → Check security groups
   - Secrets not found → Verify secrets in Secrets Manager
   - Image pull error → Check ECR repository and permissions

### Database Connection Issues

1. **Verify RDS Endpoint**:
   ```bash
   cd terraform
   terraform output rds_endpoint
   ```

2. **Check Security Groups**:
   ```bash
   # ECS tasks must be in same VPC as RDS
   # RDS security group must allow ingress from ECS security group
   ```

3. **Test Connection** (from ECS task):
   ```bash
   # Get running task
   TASK_ARN=$(aws ecs list-tasks --cluster family-recipes-local --query 'taskArns[0]' --output text)

   # Exec into container
   aws ecs execute-command \
     --cluster family-recipes-local \
     --task $TASK_ARN \
     --container backend \
     --interactive \
     --command "/bin/sh"

   # Inside container
   npm run migrate:latest
   ```

### Frontend Not Loading

1. **Check S3 Bucket**:
   ```bash
   cd terraform
   BUCKET=$(terraform output -raw frontend_bucket_name)
   aws s3 ls s3://$BUCKET/
   ```

2. **Check CloudFront Distribution**:
   ```bash
   DIST_ID=$(terraform output -raw cloudfront_distribution_id)
   aws cloudfront get-distribution --id $DIST_ID
   ```

3. **Check Invalidation Status**:
   ```bash
   aws cloudfront list-invalidations --distribution-id $DIST_ID
   ```

### High Costs

1. **Check NAT Gateways** (~$32/month each):
   - Consider removing for dev environments
   - Use single NAT gateway instead of one per AZ

2. **Check RDS Instance**:
   - Use smaller instance for dev (`db.t3.micro`)
   - Use Multi-AZ only for production

3. **Check Data Transfer**:
   - Review CloudWatch metrics
   - Consider enabling S3 Transfer Acceleration

## Cost Estimates

### Development Environment (local)

| Service | Instance/Type | Monthly Cost |
|---------|---------------|--------------|
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ECS Fargate | 256 CPU, 512 MB | ~$10 |
| NAT Gateway (2) | - | ~$64 |
| ALB | - | ~$16 |
| CloudFront | Low traffic | ~$1 |
| S3 | < 10 GB | < $1 |
| Secrets Manager | 4 secrets | ~$2 |
| **Total** | | **~$109/month** |

### Production Environment

| Service | Instance/Type | Monthly Cost |
|---------|---------------|--------------|
| RDS PostgreSQL (Multi-AZ) | db.t3.small | ~$60 |
| ECS Fargate (2 tasks) | 512 CPU, 1024 MB | ~$40 |
| NAT Gateway (3 AZ) | - | ~$96 |
| ALB | - | ~$16 |
| CloudFront | Medium traffic | ~$10 |
| S3 | < 100 GB | ~$3 |
| Secrets Manager | 4 secrets | ~$2 |
| **Total** | | **~$227/month** |

**Cost Optimization Tips**:
- Delete dev environments when not in use
- Use AWS Free Tier for first 12 months
- Set up CloudWatch billing alarms
- Review and remove unused resources

## Cleanup

### Full Cleanup

**WARNING**: This will delete ALL resources including databases!

```bash
cd terraform

# Make sure you have backups!
terraform destroy -var-file="environments/local.tfvars"

# Type 'yes' when prompted
```

### Partial Cleanup (Keep Database)

```bash
# Remove compute resources only
terraform destroy \
  -target=module.ecs \
  -target=module.alb \
  -target=module.cloudfront \
  -var-file="environments/local.tfvars"
```

## Next Steps

1. **Set Up CI/CD**: Integrate with GitHub Actions or GitLab CI
2. **Add Monitoring**: Set up CloudWatch dashboards and alarms
3. **Enable Backups**: Configure RDS automated backups
4. **Add Custom Domain**: Use Route 53 for DNS
5. **Implement Auto-Scaling**: Configure ECS auto-scaling policies

## Support

For issues or questions:
- Check the [Terraform README](terraform/README.md)
- Review CloudWatch logs
- Check AWS service health dashboard
- Review security groups and IAM policies

## Security Reminders

- ✅ Rotate secrets regularly (every 90 days)
- ✅ Enable MFA on AWS account
- ✅ Use least privilege IAM policies
- ✅ Enable VPC Flow Logs
- ✅ Enable CloudTrail for audit logging
- ✅ Never commit secrets to version control
- ✅ Use separate AWS accounts for prod/dev
- ✅ Enable database encryption at rest
- ✅ Use HTTPS for all traffic
- ✅ Regular security audits
