#!/bin/bash

# Database Backup and Restore Script
# Handles data preservation during updates and migrations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Create backup directory
mkdir -p "$BACKUP_DIR"

backup_database() {
    log "Starting database backup..."
    
    # Check if database container is running
    if ! docker ps | grep -q "impactbot-v2-database"; then
        error "Database container is not running. Start with: docker-compose up -d database"
    fi
    
    # Create database dump
    local backup_file="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"
    docker exec impactbot-v2-database pg_dump -U postgres -d impactbot_v2 > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $backup_file"
        
        # Compress backup
        gzip "$backup_file"
        log "Backup compressed: $backup_file.gz"
        
        # Create metadata file
        cat > "$BACKUP_DIR/backup_$TIMESTAMP.meta" << EOF
BACKUP_DATE=$TIMESTAMP
DATABASE_VERSION=$(docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -t -c "SELECT version();")
SCHEMA_VERSION=$(docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
RECORD_COUNTS=$(docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -t -c "
    SELECT json_object_agg(table_name, row_count) 
    FROM (
        SELECT schemaname||'.'||tablename as table_name, n_tup_ins - n_tup_del as row_count
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
    ) t;")
EOF
        log "Backup metadata saved: backup_$TIMESTAMP.meta"
    else
        error "Database backup failed"
    fi
}

backup_volumes() {
    log "Starting volume backup..."
    
    # Backup database volume
    docker run --rm -v impact-bot-mvp-2_postgres_data:/data -v "$BACKUP_DIR":/backup \
        alpine tar czf "/backup/postgres_volume_$TIMESTAMP.tar.gz" -C /data .
    
    # Backup redis volume
    docker run --rm -v impact-bot-mvp-2_redis_data:/data -v "$BACKUP_DIR":/backup \
        alpine tar czf "/backup/redis_volume_$TIMESTAMP.tar.gz" -C /data .
    
    log "Volume backups created"
}

backup_uploads() {
    log "Starting uploads backup..."
    
    if [ -d "./backend/uploads" ]; then
        tar czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C ./backend uploads/
        log "Uploads backup created: uploads_$TIMESTAMP.tar.gz"
    else
        warn "No uploads directory found"
    fi
}

restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file: ./backup-restore.sh restore_database path/to/backup.sql.gz"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring database from: $backup_file"
    
    # Stop services
    docker-compose stop backend frontend data-sync
    
    # Drop and recreate database
    docker exec impactbot-v2-database psql -U postgres -c "DROP DATABASE IF EXISTS impactbot_v2;"
    docker exec impactbot-v2-database psql -U postgres -c "CREATE DATABASE impactbot_v2;"
    
    # Restore from backup
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker exec -i impactbot-v2-database psql -U postgres -d impactbot_v2
    else
        docker exec -i impactbot-v2-database psql -U postgres -d impactbot_v2 < "$backup_file"
    fi
    
    log "Database restored successfully"
    
    # Restart services
    docker-compose up -d
}

list_backups() {
    log "Available backups:"
    ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No database backups found"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No volume backups found"
}

cleanup_old_backups() {
    local keep_days=${1:-7}
    log "Cleaning up backups older than $keep_days days..."
    
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$keep_days -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$keep_days -delete
    find "$BACKUP_DIR" -name "*.meta" -mtime +$keep_days -delete
    
    log "Cleanup completed"
}

case "$1" in
    "backup")
        backup_database
        backup_volumes
        backup_uploads
        log "Full backup completed: $TIMESTAMP"
        ;;
    "backup_db")
        backup_database
        ;;
    "backup_volumes")
        backup_volumes
        ;;
    "restore_db")
        restore_database "$2"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups "$2"
        ;;
    *)
        echo "Usage: $0 {backup|backup_db|backup_volumes|restore_db|list|cleanup}"
        echo ""
        echo "Commands:"
        echo "  backup          - Full backup (database + volumes + uploads)"
        echo "  backup_db       - Database only backup"
        echo "  backup_volumes  - Docker volumes backup"
        echo "  restore_db <file> - Restore database from backup"
        echo "  list            - List available backups"
        echo "  cleanup [days]  - Remove backups older than N days (default: 7)"
        exit 1
        ;;
esac