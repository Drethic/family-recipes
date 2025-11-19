#!/bin/bash

# Quick E2E validation script to run before pushing
# This runs a single test with debug output to verify E2E setup

set -e

echo "🧪 Running quick E2E validation..."
echo ""
echo "Testing: First navigation test (should find Login link)"
echo "If this passes, the full E2E suite should work."
echo ""

# Run with single worker and verbose output
npx playwright test \
  --project="Desktop Chrome" \
  --workers=1 \
  --reporter=list \
  --grep="User can navigate to login page" \
  e2e/auth-flow.spec.ts

echo ""
echo "✅ Quick validation passed!"
echo "You can now run the full suite with:"
echo "  npm run test:e2e"
