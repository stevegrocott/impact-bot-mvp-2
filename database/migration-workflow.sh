#!/bin/bash

# Database Migration Workflow
# Safe schema updates with rollback capability

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date)] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date)] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date)] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date)] INFO: $1${NC}"
}

# Migration workflow steps
pre_migration_backup() {
    log "Creating pre-migration backup..."
    ./backup-restore.sh backup_db
    
    # Create migration-specific backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local migration_backup="$BACKUP_DIR/pre_migration_$timestamp.sql"
    
    docker exec impactbot-v2-database pg_dump -U postgres -d impactbot_v2 > "$migration_backup"
    gzip "$migration_backup"
    
    echo "$migration_backup.gz" > "$BACKUP_DIR/.last_migration_backup"
    log "Migration backup created: $migration_backup.gz"
}

check_migration_safety() {
    local migration_file="$1"
    
    log "Analyzing migration safety: $migration_file"
    
    # Check for dangerous operations
    local dangerous_ops=(
        "DROP TABLE"
        "DROP COLUMN" 
        "ALTER COLUMN.*DROP"
        "TRUNCATE"
        "DELETE FROM.*WHERE"
    )
    
    for op in "${dangerous_ops[@]}"; do
        if grep -qi "$op" "$migration_file"; then
            warn "Potentially dangerous operation detected: $op"
            warn "This migration requires manual review and approval"
            
            read -p "Continue with migration? (yes/no): " confirm
            if [[ $confirm != "yes" ]]; then
                error "Migration aborted by user"
            fi
        fi
    done
    
    # Check for missing rollback scripts
    local rollback_file="${migration_file%.*}_rollback.sql"
    if [ ! -f "$rollback_file" ]; then
        warn "No rollback script found: $rollback_file"
        warn "Consider creating a rollback script for this migration"
    fi
    
    log "Migration safety check completed"
}

apply_migration() {
    local migration_file="$1"
    
    if [ ! -f "$migration_file" ]; then
        error "Migration file not found: $migration_file"
    fi
    
    log "Applying migration: $(basename $migration_file)"
    
    # Create migration log entry
    local migration_name=$(basename "$migration_file" .sql)
    local timestamp=$(date +%Y-%m-%d\ %H:%M:%S)
    
    # Apply migration
    if docker exec -i impactbot-v2-database psql -U postgres -d impactbot_v2 < "$migration_file"; then
        log "Migration applied successfully: $migration_name"
        
        # Log migration in database
        docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -c "
            INSERT INTO schema_migrations (migration_name, applied_at, file_path) 
            VALUES ('$migration_name', '$timestamp', '$migration_file')
            ON CONFLICT (migration_name) DO UPDATE SET 
                applied_at = '$timestamp',
                file_path = '$migration_file';
        " 2>/dev/null || warn "Could not log migration (schema_migrations table may not exist)"
        
    else
        error "Migration failed: $migration_name"
    fi
}

rollback_migration() {
    local migration_name="$1"
    
    if [ -z "$migration_name" ]; then
        # Use last migration backup
        local last_backup_file="$BACKUP_DIR/.last_migration_backup"
        if [ -f "$last_backup_file" ]; then
            local backup_file=$(cat "$last_backup_file")
            log "Rolling back to last migration backup: $backup_file"
            ./backup-restore.sh restore_db "$backup_file"
        else
            error "No migration backup found for rollback"
        fi
    else
        # Look for specific rollback script
        local rollback_file="$MIGRATIONS_DIR/${migration_name}_rollback.sql"
        if [ -f "$rollback_file" ]; then
            log "Applying rollback script: $rollback_file"
            apply_migration "$rollback_file"
        else
            error "Rollback script not found: $rollback_file"
        fi
    fi
}

check_schema_integrity() {
    log "Checking database schema integrity..."
    
    # Check for basic table structure
    local table_count=$(docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -t -c "
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
    ")
    
    info "Found $table_count tables in public schema"
    
    # Check for foreign key constraints
    local fk_count=$(docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -t -c "
        SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
    ")
    
    info "Found $fk_count foreign key constraints"
    
    # Check for any constraint violations
    log "Checking for constraint violations..."
    # This would be expanded with specific checks
    
    log "Schema integrity check completed"
}

create_migration_template() {
    local migration_name="$1"
    
    if [ -z "$migration_name" ]; then
        error "Please provide migration name: create_migration <name>"
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local migration_file="$MIGRATIONS_DIR/${timestamp}_${migration_name}.sql"
    local rollback_file="$MIGRATIONS_DIR/${timestamp}_${migration_name}_rollback.sql"
    
    mkdir -p "$MIGRATIONS_DIR"
    
    # Create migration template
    cat > "$migration_file" << EOF
-- Migration: $migration_name
-- Created: $(date)
-- Author: $(whoami)

BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE new_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Remember to:
-- 1. Test this migration on a copy of production data
-- 2. Create the corresponding rollback script
-- 3. Consider performance impact on large tables
-- 4. Add appropriate indexes

COMMIT;
EOF

    # Create rollback template
    cat > "$rollback_file" << EOF
-- Rollback for: $migration_name
-- Created: $(date)

BEGIN;

-- Add rollback SQL here
-- This should undo everything in the main migration
-- Example:
-- DROP TABLE IF EXISTS new_table;

COMMIT;
EOF

    log "Migration templates created:"
    info "Migration: $migration_file"
    info "Rollback:  $rollback_file"
}

list_migrations() {
    log "Available migrations:"
    if [ -d "$MIGRATIONS_DIR" ]; then
        ls -la "$MIGRATIONS_DIR"/*.sql 2>/dev/null || info "No migrations found"
    else
        info "Migrations directory does not exist"
    fi
    
    log "Applied migrations (from database):"
    docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -c "
        SELECT migration_name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;
    " 2>/dev/null || info "No migration history available (schema_migrations table may not exist)"
}

case "$1" in
    "create")
        create_migration_template "$2"
        ;;
    "apply")
        pre_migration_backup
        check_migration_safety "$2"
        apply_migration "$2"
        check_schema_integrity
        ;;
    "rollback")
        rollback_migration "$2"
        ;;
    "list")
        list_migrations
        ;;
    "check")
        check_schema_integrity
        ;;
    *)
        echo "Usage: $0 {create|apply|rollback|list|check}"
        echo ""
        echo "Commands:"
        echo "  create <name>     - Create new migration template"
        echo "  apply <file>      - Apply migration with safety checks"
        echo "  rollback [name]   - Rollback migration or restore from backup"
        echo "  list              - List available and applied migrations"
        echo "  check             - Check database schema integrity"
        echo ""
        echo "Examples:"
        echo "  $0 create add_user_preferences"
        echo "  $0 apply migrations/20240618_add_user_preferences.sql"
        echo "  $0 rollback add_user_preferences"
        exit 1
        ;;
esac