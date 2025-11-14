#!/bin/bash
# scripts/manage-infrastructure.sh
# Helper script for managing AWS infrastructure

set -e

ENVIRONMENT=${1:-local}
ACTION=${2:-help}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cd "$TERRAFORM_DIR"

case $ACTION in
  deploy)
    log_info "Deploying $ENVIRONMENT environment..."
    terraform apply -var-file="environments/$ENVIRONMENT.tfvars"
    log_success "Deployment complete!"
    ;;

  destroy-safe)
    log_warning "Destroying $ENVIRONMENT infrastructure (database will be preserved)..."
    terraform destroy -var-file="environments/$ENVIRONMENT.tfvars"
    log_success "Infrastructure destroyed (database preserved)"
    ;;

  destroy-all)
    if [ "$ENVIRONMENT" = "production" ]; then
      log_error "Cannot destroy production database via script for safety"
      log_error "This must be done manually by editing Terraform code"
      exit 1
    fi

    log_error "⚠️  WARNING: This will PERMANENTLY DELETE the database!"
    log_error "⚠️  All data in $ENVIRONMENT will be LOST FOREVER!"
    echo ""
    read -p "Type 'DELETE-DATABASE' to confirm: " confirm

    if [ "$confirm" != "DELETE-DATABASE" ]; then
      log_info "Aborted"
      exit 1
    fi

    log_warning "Destroying everything including database..."
    terraform destroy -var-file="environments/$ENVIRONMENT.tfvars" \
      -var="allow_dev_db_destruction=true"
    log_success "Everything destroyed (including database)"
    ;;

  refresh-ami)
    log_info "Updating AMI for $ENVIRONMENT (database will be preserved)..."
    ASG_NAME="family-recipes-$ENVIRONMENT-asg"

    log_info "Starting instance refresh..."
    aws autoscaling start-instance-refresh \
      --auto-scaling-group-name $ASG_NAME \
      --preferences MinHealthyPercentage=0 \
      --region us-east-1

    log_success "Instance refresh started"
    log_info "Monitor with: aws autoscaling describe-instance-refreshes --auto-scaling-group-name $ASG_NAME"
    ;;

  backup-db)
    log_info "Creating manual backup of $ENVIRONMENT database..."
    VOLUME_ID=$(terraform output -raw postgres_volume_id)

    log_info "Creating snapshot of volume $VOLUME_ID..."
    SNAPSHOT_ID=$(aws ec2 create-snapshot \
      --volume-id $VOLUME_ID \
      --description "Manual backup - $ENVIRONMENT - $(date +%Y-%m-%d-%H-%M)" \
      --tag-specifications "ResourceType=snapshot,Tags=[{Key=Environment,Value=$ENVIRONMENT},{Key=Type,Value=manual-backup},{Key=CreatedBy,Value=manage-infrastructure-script}]" \
      --query 'SnapshotId' \
      --output text \
      --region us-east-1)

    log_success "Snapshot created: $SNAPSHOT_ID"
    log_info "Waiting for snapshot to complete..."
    aws ec2 wait snapshot-completed --snapshot-ids $SNAPSHOT_ID --region us-east-1
    log_success "Snapshot completed successfully"
    ;;

  list-snapshots)
    log_info "Available snapshots for $ENVIRONMENT:"
    aws ec2 describe-snapshots \
      --owner-ids self \
      --filters "Name=tag:Environment,Values=$ENVIRONMENT" \
      --query 'Snapshots[*].[SnapshotId,StartTime,VolumeSize,Tags[?Key==`Type`].Value | [0],State]' \
      --output table \
      --region us-east-1
    ;;

  status)
    log_info "Status of $ENVIRONMENT infrastructure:"
    echo ""
    echo "EC2 Instance:"
    aws ec2 describe-instances \
      --filters "Name=tag:Environment,Values=$ENVIRONMENT" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
      --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,InstanceType]' \
      --output table \
      --region us-east-1 || echo "No instances found"

    echo ""
    echo "Database Volume:"
    aws ec2 describe-volumes \
      --filters "Name=tag:Name,Values=family-recipes-$ENVIRONMENT-postgres-data" \
      --query 'Volumes[*].[VolumeId,State,Size,Attachments[0].InstanceId // `not-attached`]' \
      --output table \
      --region us-east-1 || echo "No volume found"

    echo ""
    echo "Snapshots (last 5):"
    aws ec2 describe-snapshots \
      --owner-ids self \
      --filters "Name=tag:Environment,Values=$ENVIRONMENT" \
      --query 'Snapshots | sort_by(@, &StartTime) | reverse(@) | [0:5].[SnapshotId,StartTime,VolumeSize,State]' \
      --output table \
      --region us-east-1 || echo "No snapshots found"

    echo ""
    echo "Auto Scaling Group:"
    aws autoscaling describe-auto-scaling-groups \
      --auto-scaling-group-names "family-recipes-$ENVIRONMENT-asg" \
      --query 'AutoScalingGroups[*].[AutoScalingGroupName,DesiredCapacity,MinSize,MaxSize,Instances[0].HealthStatus // `no-instances`]' \
      --output table \
      --region us-east-1 || echo "No ASG found"
    ;;

  cost-estimate)
    log_info "Estimated monthly costs for $ENVIRONMENT:"
    echo ""
    if [ "$ENVIRONMENT" = "local" ]; then
      cat <<'EOF'
┌─────────────────────────────────────────────┐
│ SERVICE              │ MONTHLY COST         │
├─────────────────────────────────────────────┤
│ EC2 t4g.micro        │ $6.13                │
│ EBS (20GB + 8GB)     │ $2.24                │
│ Snapshots (3 days)   │ $1.05                │
│ Secrets Manager      │ $2.00                │
│ Amplify              │ $1.00                │
│ CloudWatch           │ $1.50                │
│ Data Transfer        │ $0.45                │
├─────────────────────────────────────────────┤
│ TOTAL                │ $14.37/month         │
└─────────────────────────────────────────────┘

Annual cost: $172.44/year
Savings vs original plan: $1,195.56/year (87% cheaper!)
EOF
    else
      cat <<'EOF'
┌─────────────────────────────────────────────┐
│ SERVICE              │ MONTHLY COST         │
├─────────────────────────────────────────────┤
│ EC2 t4g.micro        │ $6.13                │
│ EBS (30GB + 8GB)     │ $3.04                │
│ Snapshots (3 days)   │ $1.60                │
│ Secrets Manager      │ $1.50                │
│ Amplify              │ $4.00                │
│ CloudWatch           │ $5.00                │
│ Data Transfer        │ $1.80                │
├─────────────────────────────────────────────┤
│ TOTAL                │ $23.07/month         │
└─────────────────────────────────────────────┘

Annual cost: $276.84/year
Savings vs original plan: $3,251.16/year (92% cheaper!)
EOF
    fi
    ;;

  help|*)
    cat <<'EOF'
Family Recipes Infrastructure Management Script

Usage: ./scripts/manage-infrastructure.sh <environment> <action>

Environment:
  local       - Development environment
  production  - Production environment

Actions:
  deploy           - Deploy or update infrastructure
  destroy-safe     - Destroy infrastructure (database preserved)
  destroy-all      - Destroy everything including database (dev only, DANGEROUS)
  refresh-ami      - Update to latest Amazon Linux 2023 AMI (database preserved)
  backup-db        - Create manual database snapshot
  list-snapshots   - List available database snapshots
  status           - Show current infrastructure status
  cost-estimate    - Show estimated monthly costs
  help             - Show this help

Examples:
  ./scripts/manage-infrastructure.sh local deploy
      Deploy development environment

  ./scripts/manage-infrastructure.sh local destroy-safe
      Destroy dev infrastructure but keep database

  ./scripts/manage-infrastructure.sh local destroy-all
      Destroy everything including database (for fresh start)

  ./scripts/manage-infrastructure.sh local refresh-ami
      Update to latest AL2023 AMI without touching database

  ./scripts/manage-infrastructure.sh production backup-db
      Create manual backup of production database

  ./scripts/manage-infrastructure.sh local status
      Check status of all resources

Database Protection:
  - Development: Protected by default, can override with destroy-all
  - Production: ALWAYS protected, cannot be destroyed via script

Cost Savings:
  - Development: $14.37/month (87% cheaper than original plan)
  - Production: $23.07/month (92% cheaper than original plan)

EOF
    ;;
esac
