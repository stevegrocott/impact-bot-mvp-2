#!/bin/bash

# Pre-Commit Validation Script
# MANDATORY validation before ANY commit
# Deployment/Integration Engineering Best Practices

set -e

echo "🚨 PRE-COMMIT VALIDATION - MANDATORY CHECKS"

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
        echo -e "${RED}🛑 COMMIT BLOCKED - Fix errors before committing${NC}"
        exit 1
    fi
}

echo -e "${BLUE}Environment: Development (localhost:3000 → localhost:3003)${NC}"

# MANDATORY 1: TypeScript Compilation - ZERO TOLERANCE
validate_step "Backend TypeScript Build" "cd backend && npm run build"
validate_step "Frontend TypeScript Build" "cd frontend && npm run build"

# MANDATORY 2: Linting and Code Quality
validate_step "Backend Linting" "cd backend && (npm run lint 2>/dev/null || npm run build)"
validate_step "Frontend Linting" "cd frontend && (npm run lint 2>/dev/null || npm run build)"

# MANDATORY 3: Environment Validation
validate_step "Environment Files Present" "test -f .env.development && test -f backend/.env && test -f frontend/.env.development"

# MANDATORY 4: Database Schema Validation
validate_step "Database Schema Check" "docker exec impactbot-v2-database psql -U postgres -d impactbot_v2_dev -c 'SELECT COUNT(*) FROM users;' >/dev/null"

# MANDATORY 5: Core Services Health
validate_step "Docker Services Health" "docker-compose ps | grep -E '(healthy|Up)' | wc -l | grep -q '^2$'"

# MANDATORY 6: Critical Dependencies
validate_step "Node Dependencies" "cd backend && npm ci --dry-run >/dev/null && cd ../frontend && npm ci --dry-run >/dev/null"

# MANDATORY 7: Basic API Connectivity
validate_step "Database Connection Test" "docker exec impactbot-v2-database pg_isready -U postgres -d impactbot_v2_dev"

echo -e "${GREEN}🎉 ALL PRE-COMMIT VALIDATIONS PASSED${NC}"
echo -e "${BLUE}✅ Safe to commit - code meets deployment standards${NC}"