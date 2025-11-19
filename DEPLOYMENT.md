# Family Recipes - AWS Deployment Guide

**Cost-Optimized Architecture for 10-20 Users**

## Overview

This deployment uses an ultra-cost-optimized AWS infrastructure designed specifically for small family/friend groups (10-20 users).

### Why This Architecture?

After evaluating traditional AWS architectures (ECS Fargate + RDS + ALB), we determined that for a small user base, we could achieve **87-92% cost savings** by using a simpler, more appropriate architecture:

- **Single EC2 instance** (t4g.micro) instead of ECS Fargate cluster
- **PostgreSQL in Docker** instead of managed RDS
- **NGINX reverse proxy** instead of Application Load Balancer
- **Public subnet** instead of private subnet + NAT Gateway
- **3-day snapshot retention** instead of long-term backups

The result? **$37.44/month total for dev + production** vs $387/month with traditional architecture.

## Cost Summary

| Environment | Monthly Cost | Annual Cost | 5-Year Cost |
|-------------|--------------|-------------|-------------|
| Development | $14.37       | $172        | $862        |
| Production  | $23.07       | $277        | $1,384      |
| **Total**   | **$37.44**   | **$449**    | **$2,246**  |

**Compare this to the original ECS+RDS+ALB architecture:**
- Original dev: $114/month → **87% savings**
- Original prod: $273/month → **92% savings**
- 5-year total: $24,480 → $2,246 = **$22,234 saved!**

### What You Get

Even with this ultra-low cost, you still get:
- ✅ Automatic daily backups (3-day retention)
- ✅ Zero-downtime deployments via GitHub Actions
- ✅ Automatic AMI security updates
- ✅ Database survives instance termination
- ✅ HTTPS support with SSL termination
- ✅ CloudWatch monitoring and logging
- ✅ SSM Session Manager access (no SSH keys)
- ✅ Secrets managed securely in AWS Secrets Manager

### What You Don't Get (and why it's OK)

For a 10-20 user family site, these features would be overkill:
- ❌ High availability / Multi-AZ (single instance is fine)
- ❌ Auto-scaling (fixed capacity is sufficient)
- ❌ Disaster recovery / Cross-region replication (3-day backups are enough)
- ❌ Managed database (PostgreSQL in Docker is reliable)

## Architecture Diagram

```
┌─────────────────┐
│  AWS Amplify    │  Frontend hosting + CDN
│  (React/Vite)   │  $1.14-1.44/month
└─────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────┐
│  EC2 Auto Scaling Group (t4g.micro)             │
│  $6.13/month                                    │
│  ┌─────────────────────────────────────────┐   │
│  │  Docker Containers:                     │   │
│  │  ├─ NGINX (reverse proxy)               │   │
│  │  ├─ Node.js Backend API                 │   │
│  │  └─ PostgreSQL 16                       │   │
│  └─────────────────────────────────────────┘   │
│                     │                           │
│                     ↓                           │
│  ┌─────────────────────────────────────────┐   │
│  │  Persistent EBS Volume (gp3)            │   │
│  │  PostgreSQL data (survives termination) │   │
│  │  20-30GB, $1.60-2.40/month              │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
        │
        ↓
┌─────────────────┐      ┌─────────────────┐
│  AWS Secrets    │      │  CloudWatch     │
│  Manager        │      │  Logs           │
│  $0.80/month    │      │  $1.00/month    │
└─────────────────┘      └─────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────┐
│  DLM Snapshots (3-day retention)                │
│  $0.40-0.60/month                               │
└─────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

Before you begin, ensure you have:

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured (`aws configure`)
3. **Terraform** v1.5.0 or later installed
4. **GitHub Account** (for CI/CD)
5. **Node.js** 20+ (for local development)
6. **Docker** (optional, only if building images locally)

### Step 1: Generate Secrets

Generate strong random secrets for your deployment:

```bash
# Generate JWT secrets
openssl rand -base64 32  # Copy this as JWT_SECRET
openssl rand -base64 32  # Copy this as JWT_REFRESH_SECRET

# Generate database password
openssl rand -base64 32  # Copy this as DB_PASSWORD

# Save these in a secure password manager!
```

### Step 2: Configure Environment Variables

Create environment variables for Terraform (these will be stored in AWS Secrets Manager):

```bash
# Option 1: Export as environment variables
export TF_VAR_db_username="recipeuser"
export TF_VAR_db_password="YOUR_DB_PASSWORD"
export TF_VAR_jwt_secret="YOUR_JWT_SECRET"
export TF_VAR_jwt_refresh_secret="YOUR_JWT_REFRESH_SECRET"
export TF_VAR_test_admin_password="admin123"      # Dev only
export TF_VAR_test_member_password="member123"    # Dev only

# Option 2: Create terraform.tfvars (DO NOT COMMIT!)
cat > terraform/terraform.tfvars <<'EOF'
db_username         = "recipeuser"
db_password         = "YOUR_DB_PASSWORD"
jwt_secret          = "YOUR_JWT_SECRET"
jwt_refresh_secret  = "YOUR_JWT_REFRESH_SECRET"
test_admin_password = "admin123"
test_member_password = "member123"
EOF
```

### Step 3: Deploy Infrastructure

Use the provided management script for easy deployment:

```bash
# Deploy development environment
./scripts/manage-infrastructure.sh deploy local

# This will:
# - Initialize Terraform
# - Create VPC, subnets, security groups
# - Create persistent EBS volume for database
# - Create EC2 Auto Scaling Group
# - Create ECR repository
# - Store secrets in AWS Secrets Manager
# - Launch EC2 instance and bootstrap containers
# - Run database migrations and seed test data
```

**First deployment takes 5-10 minutes.** Subsequent deployments are much faster.

### Step 4: Configure GitHub Actions CI/CD

Set up automated deployments from GitHub:

```bash
# 1. Get your AWS account ID
aws sts get-caller-identity --query Account --output text

# 2. Add GitHub secrets in your repository settings
# Settings → Secrets and variables → Actions → New repository secret

# Required secrets:
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
ECR_REPOSITORY=family-recipes-backend
```

### Step 5: Access Your Application

After deployment completes:

```bash
# Get the instance public IP
cd terraform
terraform output instance_public_ip

# Access your application
# Backend API: http://<INSTANCE_IP>/api/health
# Frontend: Via Amplify URL (see Amplify console)
```

### Step 6: Deploy Production (When Ready)

```bash
# Deploy production environment
./scripts/manage-infrastructure.sh deploy production

# Production uses:
# - Larger EBS volume (30GB vs 20GB)
# - No test data seeding
# - Permanent database protection (cannot be destroyed accidentally)
```

## Management Commands

The `./scripts/manage-infrastructure.sh` script provides easy management:

### Deployment Operations

```bash
# Deploy or update infrastructure
./scripts/manage-infrastructure.sh deploy <local|production>

# Check infrastructure status
./scripts/manage-infrastructure.sh status <local|production>

# Estimate monthly costs
./scripts/manage-infrastructure.sh cost-estimate <local|production>
```

### Database Operations

```bash
# Create manual database backup
./scripts/manage-infrastructure.sh backup-db <local|production>

# List all available snapshots
./scripts/manage-infrastructure.sh list-snapshots <local|production>
```

### Maintenance Operations

```bash
# Trigger AMI update (applies security patches)
./scripts/manage-infrastructure.sh refresh-ami <local|production>

# This performs a zero-downtime instance replacement:
# 1. Launches new instance with latest AMI
# 2. Attaches persistent EBS volume (database intact)
# 3. Starts containers
# 4. Terminates old instance after new one is healthy
```

### Cleanup Operations

```bash
# Destroy infrastructure but KEEP database
# (Safe for both dev and production)
./scripts/manage-infrastructure.sh destroy-safe <local|production>

# Destroy EVERYTHING including database (DEV ONLY!)
# Production databases cannot be destroyed via script
./scripts/manage-infrastructure.sh destroy-all local
```

### Help

```bash
# Show all available commands
./scripts/manage-infrastructure.sh help
```

## Continuous Integration and Deployment

The repository includes GitHub Actions workflows for automated testing and deployment.

### Continuous Integration (`.github/workflows/ci.yml`)

**Runs on every pull request** to ensure code quality:

- **Frontend Tests**: 429 tests with 99%+ coverage
- **Backend Tests**: 441 tests with 95%+ coverage
- **E2E Tests**: Playwright tests for accessibility, responsive design, and user flows
- **Linting**: ESLint checks for both frontend and backend
- **Type Checking**: TypeScript compilation verification
- **Build Verification**: Ensures production builds succeed

All tests must pass before merging to main.

### Continuous Deployment (`.github/workflows/deploy.yml`)

**Runs automatically on push to main branch**:

#### Backend Deployment

1. Builds Docker image for backend
2. Authenticates with ECR using OIDC (no long-lived credentials)
3. Pushes image to ECR with `:latest` tag
4. Triggers instance refresh in Auto Scaling Group
5. New instance pulls latest image and starts containers
6. Old instance terminates after new one is healthy

**Zero downtime** - database persists across instance replacement.

#### Frontend Deployment

1. Builds React app for production
2. Deploys to AWS Amplify
3. Amplify automatically invalidates CDN cache
4. New version is live

### Setting Up CI/CD

1. **Enable GitHub Actions** in your repository
2. **Add required secrets** (see Step 4 above)
3. **Push to main** - deployments happen automatically!

```bash
# Create a feature branch
git checkout -b feature/my-new-feature

# Make changes, commit, and push
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature

# Create pull request on GitHub
# CI tests will run automatically

# After PR approval and merge to main
# CD workflow deploys automatically
```

## Database Management

### Connecting to the Database

```bash
# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=family-recipes-local-app" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

# Connect to instance via SSM (no SSH keys needed!)
aws ssm start-session --target $INSTANCE_ID

# Inside the instance, connect to PostgreSQL
docker exec -it postgres psql -U recipeuser -d recipedb

# Run SQL queries
recipedb=# SELECT COUNT(*) FROM users;
recipedb=# SELECT COUNT(*) FROM recipes;
```

### Manual Backups

```bash
# Create backup using management script
./scripts/manage-infrastructure.sh backup-db local

# Or manually via SSM
aws ssm start-session --target $INSTANCE_ID
docker exec postgres pg_dump -U recipeuser recipedb > /tmp/backup.sql

# Download backup to your local machine
# (requires additional AWS CLI commands for S3 transfer)
```

### Restoring from Backup

```bash
# List available snapshots
./scripts/manage-infrastructure.sh list-snapshots local

# Restore process:
# 1. Create new volume from snapshot
aws ec2 create-volume \
  --snapshot-id snap-xxxxxxxxx \
  --availability-zone us-east-1a \
  --volume-type gp3

# 2. Update Terraform to reference new volume
# 3. Trigger instance refresh
./scripts/manage-infrastructure.sh refresh-ami local
```

### Running Migrations

Migrations run automatically during deployment, but you can run them manually:

```bash
# Connect to instance
aws ssm start-session --target $INSTANCE_ID

# Run migrations
docker exec -it backend npm run migrate:latest

# Rollback last migration
docker exec -it backend npm run migrate:rollback

# Run seeds (dev only)
docker exec -it backend npm run seed:run
```

## Monitoring and Logging

### Viewing Logs

```bash
# Backend application logs
aws logs tail /aws/ec2/family-recipes-local/backend --follow

# PostgreSQL logs
aws logs tail /aws/ec2/family-recipes-local/postgres --follow

# NGINX access/error logs
aws logs tail /aws/ec2/family-recipes-local/nginx --follow

# User data bootstrap logs (for debugging instance startup)
aws logs tail /aws/ec2/family-recipes-local/user-data --follow
```

### CloudWatch Metrics

Monitor key metrics in the AWS Console:

- **EC2 → Instances**: CPU utilization, network traffic, status checks
- **CloudWatch → Logs**: Application logs grouped by service
- **Auto Scaling Groups**: Instance health, scaling activities
- **EBS Volumes**: Volume status, snapshot completion

### Setting Up Alarms (Optional)

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name family-recipes-prod-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Low disk space alarm
aws cloudwatch put-metric-alarm \
  --alarm-name family-recipes-prod-low-disk \
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

### Application Not Responding

```bash
# 1. Check instance status
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID

# 2. Connect to instance
aws ssm start-session --target $INSTANCE_ID

# 3. Check Docker containers
docker ps

# 4. Check container logs
docker logs backend --tail 100
docker logs postgres --tail 100
docker logs nginx --tail 100

# 5. Test backend health endpoint
curl http://localhost:3000/api/health

# 6. Test NGINX
curl http://localhost/api/health
```

### Database Issues

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs postgres --tail 100

# Verify volume is mounted
df -h | grep postgresql

# Test database connection
docker exec -it postgres psql -U recipeuser -d recipedb -c "SELECT 1"

# Check database size
docker exec -it postgres psql -U recipeuser -d recipedb -c "\l+"
```

### Instance Won't Start

```bash
# Check Auto Scaling Group activity
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name family-recipes-local-asg \
  --max-records 10

# Check user data logs (instance bootstrap)
aws logs tail /aws/ec2/family-recipes-local/user-data --since 30m

# Check if volume attachment failed
aws ec2 describe-volumes --volume-ids vol-xxxxxxxxx
```

### Deployment Failed

```bash
# Check GitHub Actions workflow logs
# Go to: GitHub Repository → Actions → Click failed workflow

# Check Terraform errors
cd terraform
terraform plan -var-file="environments/local.tfvars"

# Check EC2 instance logs
aws logs tail /aws/ec2/family-recipes-local/user-data --since 1h
```

## Security Best Practices

### Implemented Security Features

✅ **Secrets Management**: All credentials stored in AWS Secrets Manager, never in code
✅ **Encryption at Rest**: EBS volumes encrypted with AWS KMS
✅ **IMDSv2 Required**: Instance metadata service v2 enforced
✅ **No SSH Keys**: SSM Session Manager for secure access
✅ **Least Privilege IAM**: Instance roles have minimal required permissions
✅ **Security Groups**: Restrictive inbound/outbound rules
✅ **No Hardcoded Secrets**: All secrets via environment variables

### Recommended Additional Measures

1. **Enable MFA** on AWS root and admin accounts
2. **Enable CloudTrail** for audit logging
3. **Rotate secrets** quarterly using AWS Secrets Manager rotation
4. **Review security groups** monthly
5. **Enable GuardDuty** for threat detection (optional, additional cost)
6. **Set up CloudWatch alarms** for unusual activity

### Secret Rotation

```bash
# Rotate database password
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update in Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id family-recipes/local/db-credentials \
  --secret-string "{\"username\":\"recipeuser\",\"password\":\"$NEW_PASSWORD\",\"engine\":\"postgres\",\"host\":\"localhost\",\"port\":\"5432\",\"dbname\":\"recipedb\"}"

# 3. Update PostgreSQL
aws ssm start-session --target $INSTANCE_ID
docker exec -it postgres psql -U recipeuser -d recipedb \
  -c "ALTER USER recipeuser WITH PASSWORD '$NEW_PASSWORD';"

# 4. Restart backend
docker-compose restart backend
```

## Cost Optimization

### Current Configuration (Already Optimized)

The architecture is already heavily optimized for cost:

- ✅ t4g.micro instance (smallest ARM instance, $6.13/month)
- ✅ On-demand pricing (no commitments, maximum flexibility)
- ✅ gp3 SSD volumes (cheaper than gp2, same performance)
- ✅ 3-day snapshot retention (minimal backup costs)
- ✅ No NAT Gateway ($32/month savings)
- ✅ No Application Load Balancer ($16/month savings)
- ✅ No RDS ($15/month savings)
- ✅ Single AZ (no cross-AZ traffic charges)

### Further Cost Savings (If Needed)

If you need to reduce costs even more:

```bash
# Stop instance when not in use (saves $6.13/month)
./scripts/manage-infrastructure.sh stop local

# Start instance when needed
./scripts/manage-infrastructure.sh start local

# Reduce EBS volume size (requires database migration)
# Edit terraform/environments/local.tfvars
db_volume_size = 10  # Minimum viable size

# Use S3 for uploaded images (reduces EBS usage)
# Already configured in application code
```

### Cost Breakdown by Service

**Development ($14.37/month):**
- EC2 t4g.micro: $6.13 (43%)
- Data Transfer: $2.00 (14%)
- EBS gp3 20GB: $1.60 (11%)
- Amplify: $1.44 (10%)
- ECR: $1.00 (7%)
- CloudWatch: $1.00 (7%)
- Secrets Manager: $0.80 (6%)
- Snapshots: $0.40 (3%)

**Production ($23.07/month):**
- Data Transfer: $10.00 (43%)
- EC2 t4g.micro: $6.13 (27%)
- EBS gp3 30GB: $2.40 (10%)
- Amplify: $1.14 (5%)
- ECR: $1.00 (4%)
- CloudWatch: $1.00 (4%)
- Secrets Manager: $0.80 (3%)
- Snapshots: $0.60 (3%)

## Upgrading to High Availability (If Needed)

If your user base grows significantly, you can upgrade to a high-availability setup:

### Changes Required

1. **Multiple instances** in Auto Scaling Group
2. **Application Load Balancer** for traffic distribution
3. **EFS instead of EBS** for shared database storage (or RDS)
4. **Multi-AZ deployment** for redundancy

### Cost Impact

- Add ALB: +$16/month
- Add second t4g.micro: +$6.13/month
- Switch to EFS: +$30/month (or RDS t3.micro +$15/month)
- Total: ~$60-70/month (still much less than original $114/month)

### When to Upgrade

Consider upgrading when:
- **User base exceeds 50 active users**
- **Uptime SLA becomes critical** (99.9% required)
- **Peak traffic causes performance issues**
- **Data loss risk is unacceptable** (current: 3-day backups)

## Additional Resources

- **Detailed Infrastructure Documentation**: [terraform/README.md](terraform/README.md)
- **Management Script Help**: `./scripts/manage-infrastructure.sh help`
- **GitHub Actions Workflows**: [.github/workflows/](.github/workflows/)
- **Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **Amazon Linux 2023 Docs**: https://docs.aws.amazon.com/linux/al2023/
- **Docker Compose Docs**: https://docs.docker.com/compose/

## Support

For issues, questions, or improvements:

1. Check the **Troubleshooting** section above
2. Review **CloudWatch logs** for errors
3. Check **Terraform plan output** before applying changes
4. Review **GitHub Actions logs** for CI/CD issues

## Summary

This deployment provides a **production-ready, cost-optimized infrastructure** for a family recipe sharing application with 10-20 users.

**Key Benefits:**
- ✅ 87-92% cost savings vs traditional architecture
- ✅ $37.44/month total (dev + prod)
- ✅ Zero-downtime deployments
- ✅ Automatic backups and security updates
- ✅ Simple to understand and maintain
- ✅ Easy to upgrade if needs grow

**Trade-offs:**
- ❌ Single instance (not highly available)
- ❌ Single AZ (no multi-region redundancy)
- ❌ 3-day backup retention (limited disaster recovery)

For a small family/friend application, these trade-offs are **completely acceptable** and the cost savings are **dramatic**.
