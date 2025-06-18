#!/bin/bash

# Deployment Validation Script
# Run this before claiming anything is "production ready"

set -e

echo "🔍 Starting comprehensive deployment validation..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

validate_step() {
    local step_name="$1"
    local command="$2"
    
    echo -e "${YELLOW}Validating: $step_name${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✅ $step_name: PASSED${NC}"
    else
        echo -e "${RED}❌ $step_name: FAILED${NC}"
        exit 1
    fi
}

# 1. Environment Setup
validate_step "Docker Services" "docker-compose ps | grep -q 'Up'"

# 2. Backend Syntax
validate_step "Backend Build" "cd backend && npm run build > /dev/null 2>&1"

# 3. Frontend Syntax  
validate_step "Frontend Build" "cd frontend && npm run build > /dev/null 2>&1"

# 4. Backend Startup
echo -e "${YELLOW}Starting backend for health checks...${NC}"
cd backend && npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
sleep 15

# 5. Health Endpoint
validate_step "Backend Health" "curl -f http://localhost:3003/health > /dev/null 2>&1"

# 6. Database Connection
validate_step "Database Connection" "curl -f http://localhost:3003/api/health/db > /dev/null 2>&1"

# 7. Authentication Flow
validate_step "Authentication" "curl -X POST http://localhost:3003/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"demo@impact-bot.com\",\"password\":\"demo123\"}' \
  -s | grep -q '\"success\":true'"

# 8. Protected Route Access
AUTH_TOKEN=$(curl -X POST http://localhost:3003/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@impact-bot.com","password":"demo123"}' \
  -s | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

validate_step "Protected Routes" "curl -H 'Authorization: Bearer $AUTH_TOKEN' \
  http://localhost:3003/api/user/profile -f > /dev/null 2>&1"

# 9. Frontend Connectivity
validate_step "Frontend Available" "curl -f http://localhost:3000 > /dev/null 2>&1"

# Cleanup
kill $BACKEND_PID 2>/dev/null || true

echo -e "${GREEN}🎉 ALL VALIDATIONS PASSED - DEPLOYMENT APPROVED${NC}"
echo -e "${GREEN}System is verified working end-to-end${NC}"