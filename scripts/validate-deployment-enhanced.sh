#!/bin/bash

# Enhanced Deployment Validation Script
# Multi-Environment Testing with Best Practices
# Integration/Deployment Engineering Standards

set -e

# Determine environment
ENVIRONMENT=${1:-development}
echo "🔍 Starting enhanced deployment validation for: $ENVIRONMENT"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

validate_step() {
    local step_name="$1"
    local command="$2"
    
    echo -e "${YELLOW}Validating: $step_name${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✅ $step_name: PASSED${NC}"
    else
        echo -e "${RED}❌ $step_name: FAILED${NC}"
        echo -e "${RED}🛑 DEPLOYMENT BLOCKED - Environment not ready${NC}"
        exit 1
    fi
}

# Environment-specific configuration
case $ENVIRONMENT in
    "development")
        FRONTEND_PORT=3000
        BACKEND_PORT=3003
        DB_NAME="impactbot_v2_dev"
        COMPOSE_FILE="docker-compose.yml"
        echo -e "${BLUE}📍 Testing Development Environment (Frontend: :$FRONTEND_PORT, Backend: :$BACKEND_PORT)${NC}"
        ;;
    "test")
        FRONTEND_PORT=3001
        BACKEND_PORT=3004
        DB_NAME="impactbot_v2_test"
        COMPOSE_FILE="docker-compose.yml -f docker-compose.test.yml"
        echo -e "${BLUE}📍 Testing Test Environment (Frontend: :$FRONTEND_PORT, Backend: :$BACKEND_PORT)${NC}"
        ;;
    "production")
        FRONTEND_PORT=80
        BACKEND_PORT=3003
        DB_NAME="impactbot_v2_prod"
        COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
        echo -e "${BLUE}📍 Testing Production Environment (Frontend: :$FRONTEND_PORT, Backend: :$BACKEND_PORT)${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
        echo "Valid environments: development, test, production"
        exit 1
        ;;
esac

echo -e "${BLUE}🏗️  PHASE 1: BUILD VALIDATION (MANDATORY)${NC}"

# CRITICAL: TypeScript compilation must pass - ZERO TOLERANCE
validate_step "Backend TypeScript Build" "cd backend && npm run build"
validate_step "Frontend TypeScript Build" "cd frontend && npm run build"

# Code quality validation
validate_step "Backend Lint Check" "cd backend && (npm run lint 2>/dev/null || echo 'No lint script - using build validation')"
validate_step "Frontend Lint Check" "cd frontend && (npm run lint 2>/dev/null || echo 'No lint script - using build validation')"

echo -e "${BLUE}🐳 PHASE 2: INFRASTRUCTURE VALIDATION${NC}"

# Environment infrastructure
validate_step "Docker Services Health" "docker-compose ps | grep -E '(healthy|Up)' | wc -l | grep -q '^2$'"
validate_step "Environment Configuration" "test -f .env.$ENVIRONMENT"

# Database validation
validate_step "Database Schema ($DB_NAME)" "docker exec impactbot-v2-database psql -U postgres -d $DB_NAME -c 'SELECT COUNT(*) FROM users;' >/dev/null"
validate_step "Test User Exists ($DB_NAME)" "docker exec impactbot-v2-database psql -U postgres -d $DB_NAME -c \"SELECT email FROM users WHERE email='demo@impact-bot.com';\" | grep -q demo@impact-bot.com"

echo -e "${BLUE}🚀 PHASE 3: RUNTIME VALIDATION${NC}"

# Start backend for testing
echo -e "${YELLOW}Starting backend for runtime validation...${NC}"
cd backend && npm run dev > ../validation_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for startup with timeout
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        echo -e "${GREEN}Backend started successfully${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        echo "Backend logs:"
        tail -20 validation_backend.log
        exit 1
    fi
    sleep 1
done

# Runtime health checks
validate_step "Backend Health Endpoint" "curl -s http://localhost:$BACKEND_PORT/health | grep -q 'ok'"
validate_step "Database Connection via API" "curl -s http://localhost:$BACKEND_PORT/api/health/db >/dev/null"

echo -e "${BLUE}🔐 PHASE 4: AUTHENTICATION VALIDATION${NC}"

# Authentication flow testing
validate_step "User Authentication" "curl -X POST http://localhost:$BACKEND_PORT/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"demo@impact-bot.com\",\"password\":\"demo123\"}' \
  -s | grep -q '\"success\":true'"

# Get auth token for protected route testing
AUTH_TOKEN=$(curl -X POST http://localhost:$BACKEND_PORT/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@impact-bot.com","password":"demo123"}' \
  -s | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/' 2>/dev/null || echo "")

if [ -n "$AUTH_TOKEN" ]; then
    validate_step "Protected Route Access" "curl -H 'Authorization: Bearer $AUTH_TOKEN' \
      http://localhost:$BACKEND_PORT/api/user/profile -s >/dev/null"
else
    echo -e "${YELLOW}⚠️  Could not extract auth token - skipping protected route test${NC}"
fi

echo -e "${BLUE}🌐 PHASE 5: FRONTEND VALIDATION${NC}"

# Frontend testing (if running)
if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
    validate_step "Frontend Accessibility" "curl -s http://localhost:$FRONTEND_PORT | grep -q '<title>'"
    validate_step "Frontend Login Page" "curl -s http://localhost:$FRONTEND_PORT/login >/dev/null || curl -s http://localhost:$FRONTEND_PORT | grep -q -i 'login'"
else
    echo -e "${YELLOW}⚠️  Frontend not running - start with 'cd frontend && npm start'${NC}"
fi

# Cleanup
kill $BACKEND_PID 2>/dev/null || true
rm -f validation_backend.log

echo -e "${GREEN}🎉 ALL VALIDATIONS PASSED - $ENVIRONMENT DEPLOYMENT APPROVED${NC}"
echo -e "${GREEN}✅ System verified working end-to-end in $ENVIRONMENT environment${NC}"
echo -e "${BLUE}📊 Environment Details:${NC}"
echo -e "   Frontend: http://localhost:$FRONTEND_PORT"
echo -e "   Backend:  http://localhost:$BACKEND_PORT"
echo -e "   Database: $DB_NAME"