# Family Recipes - AWS Infrastructure

This directory contains Terraform configuration for deploying the Family Recipes application to AWS with an ultra-cost-optimized architecture.

## Architecture

**Cost-Optimized Single-Instance Architecture** (87-92% cost reduction vs traditional architecture)

The infrastructure includes:

- **VPC**: Isolated network with public subnets across multiple availability zones
- **EC2 Auto Scaling Group**: Single t4g.micro instance with persistent EBS volume
  - PostgreSQL 16 in Docker container
  - Node.js backend API in Docker container
  - NGINX reverse proxy for HTTP/HTTPS
  - Automatic volume attachment on instance replacement
- **ECR**: Docker container registry for backend images
- **Persistent EBS Volume**: gp3 SSD for PostgreSQL data (survives instance termination)
- **AWS Amplify**: Frontend hosting and CDN
- **Secrets Manager**: Secure storage for credentials and secrets
- **CloudWatch**: Logging and monitoring
- **DLM Snapshots**: Automated daily backups with 3-day retention

### Why This Architecture?

For 10-20 users, this architecture provides:
- **87-92% cost savings** compared to ECS+RDS+ALB architecture
- **Simple operations**: Single instance, easy to understand and debug
- **Data persistence**: Database survives instance termination and AMI updates
- **Zero-downtime updates**: Instance refresh with automatic volume reattachment
- **Automatic backups**: Daily snapshots with 3-day retention
- **Easy disaster recovery**: Restore from snapshots when needed

## Monthly Costs

| Environment | Monthly Cost | Annual Cost | 5-Year Cost |
|-------------|--------------|-------------|-------------|
| Development | $14.37       | $172        | $862        |
| Production  | $23.07       | $277        | $1,384      |
| **Total**   | **$37.44**   | **$449**    | **$2,246**  |

### Cost Breakdown

**Development Environment ($14.37/month):**
- EC2 t4g.micro: $6.13/month (730 hours × $0.0084/hour)
- EBS 20GB gp3: $1.60/month (20GB × $0.08/GB)
- EBS Snapshots: $0.40/month (3 snapshots × 20GB × $0.05/GB, compressed ~40%)
- Secrets Manager: $0.80/month (2 secrets × $0.40/secret)
- ECR Storage: $1.00/month (~10GB × $0.10/GB)
- Data Transfer: $2.00/month (minimal outbound traffic)
- CloudWatch Logs: $1.00/month (minimal logging)
- Amplify Frontend: $1.44/month (build minutes + hosting)

**Production Environment ($23.07/month):**
- EC2 t4g.micro: $6.13/month
- EBS 30GB gp3: $2.40/month (30GB × $0.08/GB)
- EBS Snapshots: $0.60/month (3 snapshots × 30GB × $0.05/GB, compressed ~40%)
- Secrets Manager: $0.80/month
- ECR Storage: $1.00/month
- Data Transfer: $10.00/month (moderate traffic)
- CloudWatch Logs: $1.00/month
- Amplify Frontend: $1.14/month

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **Terraform** v1.5.0 or later
   ```bash
   terraform version
   ```

3. **Docker** for building images (optional, can use GitHub Actions)
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
    ├── vpc/             # VPC with public subnets
    ├── ec2-asg/         # EC2 Auto Scaling Group with persistent EBS
    ├── ecr/             # Container registry
    ├── amplify/         # Frontend hosting (optional)
    └── secrets/         # Secrets Manager configuration
```

## Quick Start with Management Script

The easiest way to manage infrastructure is using the provided management script:

```bash
# Deploy development environment
./scripts/manage-infrastructure.sh deploy local

# Deploy production environment
./scripts/manage-infrastructure.sh deploy production

# Check status
./scripts/manage-infrastructure.sh status local

# Trigger AMI update (zero-downtime)
./scripts/manage-infrastructure.sh refresh-ami local

# Create manual backup
./scripts/manage-infrastructure.sh backup-db local

# List all snapshots
./scripts/manage-infrastructure.sh list-snapshots local

# Estimate costs
./scripts/manage-infrastructure.sh cost-estimate local

# Destroy environment (keeps database by default)
./scripts/manage-infrastructure.sh destroy-safe local

# Destroy everything including database (DEV ONLY)
./scripts/manage-infrastructure.sh destroy-all local

# Show all available commands
./scripts/manage-infrastructure.sh help
```

## Manual Setup Instructions

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

This will take 5-10 minutes to create all resources.

### 7. Save Outputs

After deployment, save important outputs:

```bash
terraform output > ../infrastructure-outputs.txt

# Get specific outputs
echo "Instance Public IP: $(terraform output -raw instance_public_ip)"
echo "Application URL: http://$(terraform output -raw instance_public_ip)"
echo "ECR Repository: $(terraform output -raw ecr_backend_repository_url)"
echo "PostgreSQL Volume ID: $(terraform output -raw postgres_volume_id)"
```

## Instance User Data and Bootstrap Process

The EC2 instance automatically configures itself using the user-data script (`terraform/modules/ec2-asg/user-data.sh`):

1. **Volume Management**
   - Detaches EBS volume from old instances (if any)
   - Attaches EBS volume to current instance
   - Creates ext4 filesystem if volume is new
   - Mounts volume to `/var/lib/postgresql/data`
   - Sets correct ownership and permissions

2. **Software Installation**
   - Updates system packages
   - Installs Docker and Docker Compose
   - Installs AWS CLI v2
   - Installs CloudWatch agent

3. **Secret Retrieval**
   - Fetches database credentials from Secrets Manager
   - Fetches JWT secrets from Secrets Manager
   - Creates `.env` file for Docker Compose

4. **Container Deployment**
   - Authenticates with ECR
   - Pulls latest backend Docker image
   - Starts PostgreSQL container
   - Waits for database to be ready
   - Starts backend API container
   - Starts NGINX reverse proxy

5. **Database Initialization**
   - Runs migrations automatically
   - Seeds test data (dev environment only)

6. **Logging**
   - Sends logs to CloudWatch Logs
   - All bootstrap steps logged for debugging

## CI/CD with GitHub Actions

The repository includes automated CI/CD workflows:

### Continuous Integration (`.github/workflows/ci.yml`)

Runs on every pull request:
- Frontend tests (429 tests, 99%+ coverage)
- Backend tests (441 tests, 95%+ coverage)
- E2E Playwright tests (accessibility, responsive, flows)
- Linting and type checking
- Build verification

### Continuous Deployment (`.github/workflows/deploy.yml`)

Runs on push to main branch:
1. **Backend Deployment**
   - Builds Docker image
   - Pushes to ECR
   - Triggers instance refresh (zero-downtime update)

2. **Frontend Deployment**
   - Builds React app
   - Deploys to Amplify
   - Automatic CDN invalidation

### Required GitHub Secrets

Configure these in your GitHub repository settings:

```
AWS_ACCOUNT_ID          # Your AWS account ID
AWS_REGION              # us-east-1 (or your region)
ECR_REPOSITORY          # family-recipes-backend
```

### OIDC Authentication Setup

The workflows use OpenID Connect for secure AWS authentication without long-lived credentials:

```bash
# Create OIDC provider in AWS (one-time setup)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create IAM role for GitHub Actions (already in Terraform)
# Role: github-actions-family-recipes-local
# Role: github-actions-family-recipes-production
```

## Managing the Infrastructure

### Connecting to the Instance

Use SSM Session Manager (no SSH keys required):

```bash
# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=family-recipes-local-app" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

# Connect via SSM
aws ssm start-session --target $INSTANCE_ID
```

### Viewing Logs

```bash
# Backend application logs
aws logs tail /aws/ec2/family-recipes-local/backend --follow

# PostgreSQL logs
aws logs tail /aws/ec2/family-recipes-local/postgres --follow

# User data bootstrap logs
aws logs tail /aws/ec2/family-recipes-local/user-data --follow

# NGINX logs
aws logs tail /aws/ec2/family-recipes-local/nginx --follow
```

### Database Management

```bash
# Connect to the instance
aws ssm start-session --target $INSTANCE_ID

# Inside the instance, access PostgreSQL
docker exec -it postgres psql -U recipeuser -d recipedb

# Backup database manually
docker exec postgres pg_dump -U recipeuser recipedb > backup.sql

# Restore from backup
cat backup.sql | docker exec -i postgres psql -U recipeuser -d recipedb
```

### Zero-Downtime AMI Updates

When Amazon releases security patches for AL2023:

```bash
# Option 1: Use management script
./scripts/manage-infrastructure.sh refresh-ami local

# Option 2: Manual Terraform
terraform apply -var-file="environments/local.tfvars"
# This triggers an instance refresh automatically
```

**How it works:**
1. ASG detects launch template change (new AMI)
2. Starts new instance with updated AMI
3. User data script attaches the persistent EBS volume
4. Database is already initialized, containers start normally
5. After new instance is healthy, old instance is terminated
6. No data loss, minimal downtime

### Managing Secrets

#### View Secrets (requires AWS permissions)

```bash
aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'family-recipes')].Name"
```

#### Update a Secret

```bash
# Update JWT secrets
aws secretsmanager put-secret-value \
  --secret-id family-recipes/local/jwt-secrets \
  --secret-string '{"jwt_secret":"NEW_SECRET","jwt_refresh_secret":"NEW_REFRESH_SECRET","jwt_expires_in":"15m","jwt_refresh_expires_in":"7d"}'

# Restart containers to pick up new secrets
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=family-recipes-local-app" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ec2-user && docker-compose restart backend"]'
```

#### Rotate Database Password

```bash
# 1. Update in Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id family-recipes/local/db-credentials \
  --secret-string '{"username":"recipeuser","password":"NEW_PASSWORD","engine":"postgres","host":"localhost","port":"5432","dbname":"recipedb"}'

# 2. Update PostgreSQL password
aws ssm start-session --target $INSTANCE_ID
# Inside instance:
docker exec -it postgres psql -U recipeuser -d recipedb -c "ALTER USER recipeuser WITH PASSWORD 'NEW_PASSWORD';"

# 3. Restart backend container
docker-compose restart backend
```

## Disaster Recovery

### Restoring from Snapshots

```bash
# 1. List available snapshots
./scripts/manage-infrastructure.sh list-snapshots local

# 2. Create new volume from snapshot
aws ec2 create-volume \
  --snapshot-id snap-xxxxxxxxx \
  --availability-zone us-east-1a \
  --volume-type gp3 \
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=family-recipes-local-postgres-data-restored}]'

# 3. Update Terraform to use restored volume
# Edit terraform/modules/ec2-asg/main.tf and comment out the original volume resource
# Import the restored volume instead

# 4. Trigger instance refresh
./scripts/manage-infrastructure.sh refresh-ami local
```

### Cross-Region Disaster Recovery (Optional)

For production, you can manually copy snapshots to another region:

```bash
# Copy snapshot to us-west-2
aws ec2 copy-snapshot \
  --source-region us-east-1 \
  --source-snapshot-id snap-xxxxxxxxx \
  --destination-region us-west-2 \
  --description "DR backup of family-recipes production database"
```

## Monitoring

### CloudWatch Dashboards

Create a custom dashboard to monitor key metrics:

```bash
# CPU Utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=family-recipes-local-asg \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Setting Up Alarms

```bash
# High CPU alarm (for production)
aws cloudwatch put-metric-alarm \
  --alarm-name family-recipes-production-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Disk space alarm
aws cloudwatch put-metric-alarm \
  --alarm-name family-recipes-production-low-disk \
  --alarm-description "Alert when disk > 85% full" \
  --metric-name disk_used_percent \
  --namespace CWAgent \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Troubleshooting

### Instance Not Starting

```bash
# Check ASG activity
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name family-recipes-local-asg \
  --max-records 10

# Check instance status
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID

# View user data logs
aws logs tail /aws/ec2/family-recipes-local/user-data --since 30m
```

### Database Connection Issues

```bash
# Connect to instance
aws ssm start-session --target $INSTANCE_ID

# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs postgres --tail 100

# Verify volume is mounted
df -h | grep postgresql

# Test database connection
docker exec -it postgres psql -U recipeuser -d recipedb -c "SELECT version();"
```

### Application Not Responding

```bash
# Check backend container status
aws ssm start-session --target $INSTANCE_ID
docker ps
docker logs backend --tail 100

# Check NGINX
docker logs nginx --tail 100

# Test backend health endpoint
curl http://localhost:3000/api/health

# Test NGINX
curl http://localhost/api/health
```

### Volume Won't Attach

```bash
# Check volume status
aws ec2 describe-volumes --volume-ids vol-xxxxxxxxx

# If volume is stuck "in-use", force detach
aws ec2 detach-volume --volume-id vol-xxxxxxxxx --force

# Check volume availability zone matches instance
aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].Placement.AvailabilityZone'

aws ec2 describe-volumes --volume-ids vol-xxxxxxxxx \
  --query 'Volumes[0].AvailabilityZone'
```

## Cleanup

### Destroy Infrastructure (Keep Database)

This is safe for both dev and production - preserves the database:

```bash
# Using management script (recommended)
./scripts/manage-infrastructure.sh destroy-safe local

# Or manually with Terraform
terraform destroy -var-file="environments/local.tfvars"
```

The database volume has lifecycle protection and will NOT be destroyed.

### Destroy Everything Including Database (DEV ONLY)

**WARNING**: This permanently deletes the database!

```bash
# Only works for non-production environments
./scripts/manage-infrastructure.sh destroy-all local

# Production databases CANNOT be destroyed via script
# They have permanent lifecycle protection
```

### Manual Database Volume Deletion (Production)

If you really need to delete production database:

```bash
# 1. Create final backup
./scripts/manage-infrastructure.sh backup-db production

# 2. Remove lifecycle protection from Terraform
# Edit terraform/modules/ec2-asg/main.tf
# Comment out the prevent_destroy lifecycle block

# 3. Destroy everything
terraform destroy -var-file="environments/production.tfvars"
```

## Cost Optimization Tips

### Development Environment

Current setup is already highly optimized:
- t4g.micro instance (smallest ARM instance)
- On-demand pricing (no commitments)
- 20GB gp3 volume (minimum needed)
- 3-day snapshot retention (minimal backup costs)
- Public subnet (no NAT Gateway)
- Single AZ (no cross-AZ traffic)

**Further savings (if needed):**
- Stop instance when not in use (saves $6.13/month)
- Reduce EBS volume size if possible
- Use S3 for image storage instead of EBS

### Production Environment

Current production setup prioritizes cost over redundancy:
- Single instance (no high availability)
- Single AZ (no multi-AZ)
- 3-day backup retention (minimal DR)

**If you need higher availability:**
- Increase min_size to 2 in ASG (doubles EC2 cost)
- Use Multi-AZ (requires EFS instead of EBS, +$30/month)
- Increase backup retention (minimal cost increase)
- Add Application Load Balancer (+$16/month)

## Security Best Practices

1. **Never commit secrets** to version control ✅
2. **Use IAM roles** instead of access keys (already configured) ✅
3. **Enable MFA** on AWS root and admin accounts
4. **Rotate secrets** regularly (use AWS Secrets Manager rotation)
5. **Use IMDSv2** (already required in launch template) ✅
6. **Enable encryption** at rest (EBS encrypted by default) ✅
7. **Review security groups** regularly
8. **Enable CloudTrail** for audit logging
9. **Use least privilege** IAM policies ✅
10. **Use SSM Session Manager** instead of SSH (already configured) ✅

## Comparison: Old vs New Architecture

| Aspect | Old (ECS+RDS+ALB) | New (EC2+Docker) | Savings |
|--------|-------------------|------------------|---------|
| **Dev Cost** | $114/month | $14.37/month | **87%** |
| **Prod Cost** | $273/month | $23.07/month | **92%** |
| **5-Year Cost** | $24,480 | $2,246 | **91%** |
| **Complexity** | High (7 services) | Low (3 services) | Simpler |
| **Database** | Managed RDS | Docker PostgreSQL | Same functionality |
| **Scaling** | Auto-scales 0-4 | Fixed 1 instance | Appropriate for 10-20 users |
| **HA** | Multi-AZ | Single AZ | Not needed for small user base |
| **Backups** | Automated | Automated (DLM) | Same protection |

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Check AWS service health dashboard
4. Review Terraform plan output carefully before applying

## Additional Resources

- [Management Script Documentation](../scripts/manage-infrastructure.sh)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Amazon Linux 2023 Documentation](https://docs.aws.amazon.com/linux/al2023/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [SSM Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
