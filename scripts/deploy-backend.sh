#!/bin/bash

# Deploy Backend to AWS ECS
# Usage: ./scripts/deploy-backend.sh <environment>

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
echo -e "${GREEN}║         Family Recipes - Backend Deployment          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "AWS Region:  ${YELLOW}$AWS_REGION${NC}"
echo ""

# Get infrastructure outputs
cd "$PROJECT_ROOT/terraform"
echo -e "${YELLOW}→ Fetching infrastructure information...${NC}"

ECR_REPO=$(terraform output -raw ecr_backend_repository_url 2>/dev/null)
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null)
ECS_SERVICE=$(terraform output -raw ecs_service_name 2>/dev/null)

if [ -z "$ECR_REPO" ] || [ -z "$ECS_CLUSTER" ] || [ -z "$ECS_SERVICE" ]; then
  echo -e "${RED}✗ Failed to get infrastructure outputs. Is Terraform deployed?${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Infrastructure information retrieved${NC}"
echo "  ECR Repository: $ECR_REPO"
echo "  ECS Cluster: $ECS_CLUSTER"
echo "  ECS Service: $ECS_SERVICE"
echo ""

# Build Docker image
cd "$PROJECT_ROOT/backend"
echo -e "${YELLOW}→ Building Docker image...${NC}"

IMAGE_TAG="latest"
docker build -t family-recipes-backend:$IMAGE_TAG --target production .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
  echo -e "${RED}✗ Failed to build Docker image${NC}"
  exit 1
fi

# Login to ECR
echo -e "${YELLOW}→ Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Logged into ECR${NC}"
else
  echo -e "${RED}✗ Failed to login to ECR${NC}"
  exit 1
fi

# Tag and push image
echo -e "${YELLOW}→ Tagging and pushing image to ECR...${NC}"
docker tag family-recipes-backend:$IMAGE_TAG $ECR_REPO:$IMAGE_TAG
docker tag family-recipes-backend:$IMAGE_TAG $ECR_REPO:$(date +%Y%m%d-%H%M%S)

docker push $ECR_REPO:$IMAGE_TAG
docker push $ECR_REPO:$(date +%Y%m%d-%H%M%S)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Image pushed to ECR${NC}"
else
  echo -e "${RED}✗ Failed to push image to ECR${NC}"
  exit 1
fi

# Update ECS service
echo -e "${YELLOW}→ Updating ECS service...${NC}"
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION \
  > /dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ ECS service update initiated${NC}"
else
  echo -e "${RED}✗ Failed to update ECS service${NC}"
  exit 1
fi

# Wait for deployment
echo -e "${YELLOW}→ Waiting for deployment to complete...${NC}"
echo "  (This may take a few minutes)"

aws ecs wait services-stable \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Deployment completed successfully${NC}"
else
  echo -e "${RED}✗ Deployment failed or timed out${NC}"
  echo "  Check ECS console for details"
  exit 1
fi

# Run migrations
echo ""
echo -e "${YELLOW}→ Running database migrations...${NC}"
$PROJECT_ROOT/scripts/run-migrations.sh $ENVIRONMENT

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Deployment Completed Successfully!        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Check service health: ./scripts/check-health.sh $ENVIRONMENT"
echo "  2. View logs: aws logs tail /ecs/family-recipes-$ENVIRONMENT-backend --follow"
echo ""
