#!/bin/bash

# Deploy Frontend to AWS S3 and CloudFront
# Usage: ./scripts/deploy-frontend.sh <environment>

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
echo -e "${GREEN}║         Family Recipes - Frontend Deployment         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "AWS Region:  ${YELLOW}$AWS_REGION${NC}"
echo ""

# Get infrastructure outputs
cd "$PROJECT_ROOT/terraform"
echo -e "${YELLOW}→ Fetching infrastructure information...${NC}"

S3_BUCKET=$(terraform output -raw frontend_bucket_name 2>/dev/null)
CF_DISTRIBUTION=$(terraform output -raw cloudfront_distribution_id 2>/dev/null)
ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null)

if [ -z "$S3_BUCKET" ] || [ -z "$CF_DISTRIBUTION" ]; then
  echo -e "${RED}✗ Failed to get infrastructure outputs. Is Terraform deployed?${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Infrastructure information retrieved${NC}"
echo "  S3 Bucket: $S3_BUCKET"
echo "  CloudFront: $CF_DISTRIBUTION"
echo "  Backend API: $ALB_DNS"
echo ""

# Set API URL for build
export VITE_API_URL="http://$ALB_DNS/api"

# Build frontend
cd "$PROJECT_ROOT/frontend"
echo -e "${YELLOW}→ Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
fi

echo -e "${YELLOW}→ Building frontend for production...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
  echo -e "${RED}✗ Failed to build frontend${NC}"
  exit 1
fi

# Sync to S3
echo -e "${YELLOW}→ Syncing files to S3...${NC}"
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --region $AWS_REGION

# HTML files with no caching (for SPA routing)
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Files synced to S3${NC}"
else
  echo -e "${RED}✗ Failed to sync files to S3${NC}"
  exit 1
fi

# Invalidate CloudFront cache
echo -e "${YELLOW}→ Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CF_DISTRIBUTION \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text \
  --region $AWS_REGION)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ CloudFront invalidation initiated (ID: $INVALIDATION_ID)${NC}"
  echo "  (This may take a few minutes to complete)"
else
  echo -e "${RED}✗ Failed to invalidate CloudFront cache${NC}"
  exit 1
fi

# Get CloudFront URL
CF_URL=$(terraform output -raw cloudfront_domain_name 2>/dev/null)

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Deployment Completed Successfully!        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Your application is available at:"
echo -e "  ${GREEN}https://$CF_URL${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the application"
echo "  2. Check CloudFront invalidation status:"
echo "     aws cloudfront get-invalidation --distribution-id $CF_DISTRIBUTION --id $INVALIDATION_ID"
echo ""
