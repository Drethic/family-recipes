#!/bin/bash

# Generate secrets for Terraform deployment
# Usage: ./scripts/generate-secrets.sh <environment>

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

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Family Recipes - Secret Generation           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo ""

# Check for openssl
if ! command -v openssl &> /dev/null; then
  echo -e "${RED}✗ openssl is required but not installed${NC}"
  exit 1
fi

# Generate secrets
echo -e "${YELLOW}→ Generating secrets...${NC}"

DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

if [ "$ENVIRONMENT" != "production" ]; then
  TEST_ADMIN_PASSWORD="admin123"
  TEST_MEMBER_PASSWORD="member123"
else
  TEST_ADMIN_PASSWORD=""
  TEST_MEMBER_PASSWORD=""
fi

echo -e "${GREEN}✓ Secrets generated${NC}"
echo ""

# Output secrets
echo -e "${GREEN}Copy these values for your terraform.tfvars file:${NC}"
echo ""
echo "# Database Configuration"
echo "db_username         = \"recipeuser\""
echo "db_password         = \"$DB_PASSWORD\""
echo ""
echo "# JWT Secrets"
echo "jwt_secret          = \"$JWT_SECRET\""
echo "jwt_refresh_secret  = \"$JWT_REFRESH_SECRET\""

if [ "$ENVIRONMENT" != "production" ]; then
  echo ""
  echo "# Test User Credentials (local/dev only)"
  echo "test_admin_password = \"$TEST_ADMIN_PASSWORD\""
  echo "test_member_password = \"$TEST_MEMBER_PASSWORD\""
fi

echo ""
echo -e "${YELLOW}⚠ IMPORTANT SECURITY NOTES:${NC}"
echo "  1. Save these secrets in a secure password manager"
echo "  2. Create terraform/terraform.tfvars with these values"
echo "  3. NEVER commit terraform.tfvars to version control"
echo "  4. For production, use a secrets management system"
echo ""

# Optionally create tfvars file
read -p "Create terraform.tfvars file automatically? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  TFVARS_FILE="../terraform/terraform.tfvars"

  cat > $TFVARS_FILE <<EOF
# Database Configuration
db_username         = "recipeuser"
db_password         = "$DB_PASSWORD"

# JWT Secrets
jwt_secret          = "$JWT_SECRET"
jwt_refresh_secret  = "$JWT_REFRESH_SECRET"
EOF

  if [ "$ENVIRONMENT" != "production" ]; then
    cat >> $TFVARS_FILE <<EOF

# Test User Credentials
test_admin_password = "$TEST_ADMIN_PASSWORD"
test_member_password = "$TEST_MEMBER_PASSWORD"
EOF
  fi

  echo -e "${GREEN}✓ Created $TFVARS_FILE${NC}"
  echo -e "${YELLOW}⚠ Remember: This file contains secrets. Do not commit it!${NC}"
else
  echo "Skipped file creation. Copy the values manually."
fi

echo ""
echo -e "${GREEN}Secret generation complete!${NC}"
