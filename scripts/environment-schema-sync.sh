#!/bin/bash

# Environment-Schema Synchronization Script
# Aligns database schema with Prisma model across all environments

set -e

ENVIRONMENT=${1:-development}

echo "🔄 Synchronizing schema for $ENVIRONMENT environment..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

validate_step() {
    local step_name="$1"
    local command="$2"
    
    echo -e "${YELLOW}Step: $step_name${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✅ $step_name: SUCCESS${NC}"
    else
        echo -e "${RED}❌ $step_name: FAILED${NC}"
        exit 1
    fi
}

case $ENVIRONMENT in
    "development")
        DB_NAME="impactbot_v2_dev"
        MIGRATION_MODE="push" # Fast iteration
        echo -e "${BLUE}🔧 Development Environment - Fast Schema Push${NC}"
        ;;
    "test")
        DB_NAME="impactbot_v2_test"
        MIGRATION_MODE="migrate" # Controlled changes
        echo -e "${BLUE}🧪 Test Environment - Controlled Migration${NC}"
        ;;
    "production")
        DB_NAME="impactbot_v2_prod"
        MIGRATION_MODE="deploy" # Manual review
        echo -e "${BLUE}🚀 Production Environment - Manual Deployment${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Valid environments: development, test, production"
        exit 1
        ;;
esac

# Step 1: Backup current database
validate_step "Database Backup" "./database/backup-restore.sh backup_db"

# Step 2: Validate schema integrity  
validate_step "Schema Validation" "npx prisma validate"

# Step 3: Generate Prisma client
validate_step "Prisma Client Generation" "npx prisma generate"

# Step 4: Apply schema changes based on environment
if [ "$MIGRATION_MODE" = "push" ]; then
    # Development: Fast push (may cause data loss)
    validate_step "Schema Push (Development)" "npx prisma db push --accept-data-loss"
elif [ "$MIGRATION_MODE" = "migrate" ]; then
    # Test: Controlled migration
    validate_step "Schema Migration (Test)" "npx prisma migrate dev --name sync_environment_schema"
elif [ "$MIGRATION_MODE" = "deploy" ]; then
    # Production: Manual deployment
    echo -e "${YELLOW}⚠️  Production deployment requires manual review${NC}"
    echo "Run: npx prisma migrate deploy"
    echo "After reviewing migration files in prisma/migrations/"
    exit 0
fi

# Step 5: Verify schema alignment
validate_step "Schema Verification" "npx prisma db pull --print"

# Step 6: Seed test data for development
if [ "$ENVIRONMENT" = "development" ]; then
    validate_step "Development Data Seeding" "docker exec impactbot-v2-database psql -U postgres -d $DB_NAME -f /docker-entrypoint-initdb.d/seed/01_test_users.sql"
fi

# Step 7: Validate TypeScript compilation
validate_step "TypeScript Compilation Check" "npm run build"

echo -e "${GREEN}🎉 Schema synchronization completed for $ENVIRONMENT environment${NC}"
echo -e "${BLUE}✅ Database: $DB_NAME${NC}"
echo -e "${BLUE}✅ Schema: Aligned with code expectations${NC}"
echo -e "${BLUE}✅ TypeScript: Compilation successful${NC}"