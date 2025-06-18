# Data Management Guide

## 🗄️ Data Lifecycle Management

### What Happens to Your Data During Updates?

| Data Type | Location | Persistence | Update Behavior |
|-----------|----------|-------------|-----------------|
| **User Data** | PostgreSQL Volume | ✅ Persistent | Preserved across container updates |
| **Chat History** | PostgreSQL Volume | ✅ Persistent | Preserved across container updates |
| **File Uploads** | Host Volume Mount | ✅ Persistent | Preserved across container updates |
| **Indicators & Measurements** | PostgreSQL Volume | ✅ Persistent | Preserved across container updates |
| **Cache Data** | Redis Volume | ⚠️ Temporary | May be cleared during updates |
| **Session Data** | Redis Volume | ⚠️ Temporary | Users need to re-login after updates |

## 🔄 Environment-Specific Data Management

### Development Environment
```bash
# Uses separate dev database and volumes
docker-compose up -d  # Uses docker-compose.override.yml automatically

# Data location: postgres_dev_data volume
# Includes test users and sample data
```

### Test Environment  
```bash
# Uses isolated test database
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Data location: postgres_test_data volume  
# Clean database for each test run
```

### Production Environment
```bash
# Uses production-hardened configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Data location: postgres_prod_data volume
# No test data, production-ready
```

## 📋 Before Any Database Update

### 1. Create Backup
```bash
# Full backup (recommended before major updates)
./database/backup-restore.sh backup

# Database only
./database/backup-restore.sh backup_db

# List existing backups
./database/backup-restore.sh list
```

### 2. Test Migration (if schema changes)
```bash
# Create migration
./database/migration-workflow.sh create add_new_feature

# Apply migration safely
./database/migration-workflow.sh apply migrations/20240618_add_new_feature.sql

# Check database integrity
./database/migration-workflow.sh check
```

## 🚨 Container Update Workflow

### Safe Update Process:
```bash
# 1. Backup current data
./database/backup-restore.sh backup

# 2. Stop services
docker-compose down

# 3. Update containers (preserves volumes)
docker-compose pull
docker-compose up -d

# 4. Verify services are working
./scripts/validate-deployment.sh

# 5. If issues occur, rollback
# ./database/backup-restore.sh restore_db backups/database_backup_TIMESTAMP.sql.gz
```

### Data-Safe Update Commands:
```bash
# ✅ SAFE - Preserves all data
docker-compose down && docker-compose up -d

# ✅ SAFE - Updates images, preserves volumes
docker-compose pull && docker-compose up -d --force-recreate

# ⚠️ CAUTION - Rebuilds containers, preserves volumes
docker-compose up -d --build

# ❌ DANGEROUS - Removes volumes and all data
docker-compose down -v  # DON'T USE THIS
```

## 🔧 Recovery Procedures

### If Data is Lost:
```bash
# 1. Stop all services
docker-compose down

# 2. Restore from latest backup
./database/backup-restore.sh restore_db backups/database_backup_LATEST.sql.gz

# 3. Restart services
docker-compose up -d

# 4. Verify data integrity
./database/migration-workflow.sh check
```

### If Migration Fails:
```bash
# Automatic rollback to pre-migration state
./database/migration-workflow.sh rollback

# Or restore from specific backup
./database/backup-restore.sh restore_db backups/pre_migration_TIMESTAMP.sql.gz
```

## 📊 Data Monitoring

### Check Data Status:
```bash
# View current data volumes
docker volume ls | grep impact-bot

# Check database size
docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check recent user activity
docker exec impactbot-v2-database psql -U postgres -d impactbot_v2 -c "
  SELECT COUNT(*) as total_users, 
         COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days') as active_users
  FROM users;
"
```

## 🔐 Backup Strategy

### Automated Backups:
- **Development**: Manual backups before major changes
- **Production**: Daily automated backups (configured in docker-compose.prod.yml)
- **Retention**: 30 days of daily backups, 12 months of weekly backups

### Backup Verification:
```bash
# Test backup integrity
./database/backup-restore.sh restore_db backups/test_backup.sql.gz
./database/migration-workflow.sh check
```

## ⚠️ Important Notes

1. **Docker Volume Persistence**: Data in named volumes persists across container recreation
2. **Host Mount Persistence**: Files in `./backend/uploads` persist on host filesystem  
3. **Cache Expiration**: Redis cache data may be lost during updates (this is expected)
4. **Session Management**: Users will need to re-login after Redis restarts
5. **Migration Safety**: Always backup before schema changes
6. **Environment Isolation**: Dev/Test/Prod use separate databases and volumes

## 🎯 Best Practices

- ✅ Always backup before major updates
- ✅ Test migrations in development first  
- ✅ Use environment-specific configurations
- ✅ Monitor backup integrity regularly
- ✅ Document schema changes in migrations
- ❌ Never use `docker-compose down -v` in production
- ❌ Never edit production data directly
- ❌ Never skip backup before schema changes