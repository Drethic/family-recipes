#!/bin/bash

# Run database migrations in ECS
# Usage: ./scripts/run-migrations.sh <environment>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Environment not specified${NC}"
  echo "Usage: $0 <environment>"
  echo "Example: $0 local"
  exit 1
fi

ENVIRONMENT=$1
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo -e "${YELLOW}→ Running database migrations for $ENVIRONMENT...${NC}"

# Get infrastructure outputs
cd "$PROJECT_ROOT/terraform"
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null)

if [ -z "$ECS_CLUSTER" ]; then
  echo -e "${RED}✗ Failed to get ECS cluster name. Is Terraform deployed?${NC}"
  exit 1
fi

# Get a running task
TASK_ARN=$(aws ecs list-tasks \
  --cluster $ECS_CLUSTER \
  --desired-status RUNNING \
  --query 'taskArns[0]' \
  --output text \
  --region $AWS_REGION)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo -e "${RED}✗ No running tasks found in cluster $ECS_CLUSTER${NC}"
  exit 1
fi

echo "  Running migrations in task: $(basename $TASK_ARN)"

# Execute migrations
aws ecs execute-command \
  --cluster $ECS_CLUSTER \
  --task $TASK_ARN \
  --container backend \
  --interactive \
  --command "npm run migrate:latest" \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Migrations completed successfully${NC}"
else
  echo -e "${RED}✗ Migrations failed${NC}"
  exit 1
fi

# Run seeds for non-production environments
if [ "$ENVIRONMENT" != "production" ]; then
  echo -e "${YELLOW}→ Running database seeds...${NC}"

  aws ecs execute-command \
    --cluster $ECS_CLUSTER \
    --task $TASK_ARN \
    --container backend \
    --interactive \
    --command "npm run seed:run" \
    --region $AWS_REGION

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Seeds completed successfully${NC}"
  else
    echo -e "${YELLOW}⚠ Seeds may have failed (this is ok if data already exists)${NC}"
  fi
fi

echo -e "${GREEN}✓ Database initialization complete${NC}"
