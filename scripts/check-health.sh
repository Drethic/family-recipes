#!/bin/bash

# Check health of deployed application
# Usage: ./scripts/check-health.sh <environment>

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

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Family Recipes - Health Check                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Get infrastructure outputs
cd "$PROJECT_ROOT/terraform"
ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null)
CF_URL=$(terraform output -raw cloudfront_domain_name 2>/dev/null)
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null)
ECS_SERVICE=$(terraform output -raw ecs_service_name 2>/dev/null)

if [ -z "$ALB_DNS" ]; then
  echo -e "${RED}✗ Failed to get infrastructure outputs. Is Terraform deployed?${NC}"
  exit 1
fi

# Check backend health
echo -e "${YELLOW}→ Checking backend health...${NC}"
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/api/health)

if [ "$BACKEND_HEALTH" == "200" ]; then
  echo -e "${GREEN}✓ Backend is healthy (HTTP $BACKEND_HEALTH)${NC}"
  echo "  URL: http://$ALB_DNS/api/health"
else
  echo -e "${RED}✗ Backend is unhealthy (HTTP $BACKEND_HEALTH)${NC}"
  echo "  URL: http://$ALB_DNS/api/health"
fi

# Check frontend
echo -e "${YELLOW}→ Checking frontend...${NC}"
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://$CF_URL)

if [ "$FRONTEND_HEALTH" == "200" ]; then
  echo -e "${GREEN}✓ Frontend is accessible (HTTP $FRONTEND_HEALTH)${NC}"
  echo "  URL: https://$CF_URL"
else
  echo -e "${RED}✗ Frontend is not accessible (HTTP $FRONTEND_HEALTH)${NC}"
  echo "  URL: https://$CF_URL"
fi

# Check ECS service
echo -e "${YELLOW}→ Checking ECS service...${NC}"
RUNNING_COUNT=$(aws ecs describe-services \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --query 'services[0].runningCount' \
  --output text \
  --region $AWS_REGION)

DESIRED_COUNT=$(aws ecs describe-services \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --query 'services[0].desiredCount' \
  --output text \
  --region $AWS_REGION)

if [ "$RUNNING_COUNT" == "$DESIRED_COUNT" ]; then
  echo -e "${GREEN}✓ ECS service is stable ($RUNNING_COUNT/$DESIRED_COUNT tasks)${NC}"
else
  echo -e "${YELLOW}⚠ ECS service is scaling ($RUNNING_COUNT/$DESIRED_COUNT tasks)${NC}"
fi

# Check database
echo -e "${YELLOW}→ Checking database...${NC}"
DB_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier family-recipes-$ENVIRONMENT \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text \
  --region $AWS_REGION 2>/dev/null || echo "not-found")

if [ "$DB_STATUS" == "available" ]; then
  echo -e "${GREEN}✓ Database is available${NC}"
elif [ "$DB_STATUS" == "not-found" ]; then
  echo -e "${RED}✗ Database instance not found${NC}"
else
  echo -e "${YELLOW}⚠ Database status: $DB_STATUS${NC}"
fi

echo ""
echo -e "${GREEN}Health check complete!${NC}"
echo ""
echo "URLs:"
echo "  Backend API: http://$ALB_DNS/api"
echo "  Frontend:    https://$CF_URL"
echo ""
