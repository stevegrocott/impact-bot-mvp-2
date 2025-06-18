# Impact Bot v2 - Environment Setup Guide

## Overview

This project now includes comprehensive environment management scripts that properly support pgvector database functionality for production-ready vector operations.

## Quick Start

### Development Environment
```bash
# Start development environment with vector support
./scripts/dev-up.sh

# Check status
./scripts/status.sh

# Test vector database functionality
./scripts/test-vector-db.sh

# Stop development environment
./scripts/dev-down.sh
```

### Production Environment
```bash
# Start production environment
./scripts/prod-up.sh

# Stop production environment
./scripts/prod-down.sh
```

### Quick Switching
```bash
# Switch from production to development
./scripts/switch-to-dev.sh

# Switch from development to production
./scripts/switch-to-prod.sh
```

## Environment Features

### Development Environment
- **PostgreSQL 16** with **pgvector** extension
- **Redis 7** for caching
- **PgAdmin 4** for database management
- **Hot reload** for both frontend and backend
- **Comprehensive logging** with separate log files
- **Health checks** for all services
- **Vector database testing** capabilities

### Production Environment
- **Dockerized** frontend and backend
- **Production-optimized** PostgreSQL with pgvector
- **Automated backups** (daily at 2 AM)
- **Health monitoring** and restart policies
- **Secure internal networking**
- **Environment-specific configuration**

## Services and Ports

### Development
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3003
- **PgAdmin**: http://localhost:5050 (admin@impact-bot.com / admin)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Production
- **Application**: http://localhost (port 80)
- **PostgreSQL**: Internal network only
- **Redis**: Internal network only
- **All services**: Dockerized with health checks

## Database Configuration

### Vector Extension Support
Both environments include full **pgvector** support for:
- **Embedding storage** (vector(1536) columns)
- **Similarity search** operations
- **Vector indexing** for performance
- **Hybrid content architecture**

### Schema Management
- **Development**: Uses `schema-hybrid.prisma` with vector types
- **Auto-migration**: Schema changes applied automatically
- **Data seeding**: Test data available in development
- **Backup/Restore**: Automated in production

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `dev-up.sh` | Start development environment with vector support |
| `dev-down.sh` | Stop development environment and cleanup |
| `prod-up.sh` | Start production environment with Docker |
| `prod-down.sh` | Stop production environment |
| `switch-to-dev.sh` | Quick switch to development |
| `switch-to-prod.sh` | Quick switch to production |
| `status.sh` | Check environment status and health |
| `test-vector-db.sh` | Test pgvector functionality |

## Vector Database Testing

The `test-vector-db.sh` script verifies:
- ✅ pgvector extension installation
- ✅ Vector operations (insert, search, similarity)
- ✅ Prisma schema validation
- ✅ Prisma client generation

## Troubleshooting

### Common Issues

**Vector extension not found:**
```bash
# The scripts automatically handle this, but you can manually install:
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d impact_bot_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Services not starting:**
```bash
# Check status and logs
./scripts/status.sh
tail -f backend.log frontend.log
```

**Port conflicts:**
```bash
# Stop all services first
./scripts/dev-down.sh
./scripts/prod-down.sh
```

### Environment Reset
```bash
# Complete environment reset
./scripts/dev-down.sh
docker system prune -f
./scripts/dev-up.sh
```

## Development Workflow

1. **Start Development**: `./scripts/dev-up.sh`
2. **Check Status**: `./scripts/status.sh`
3. **Test Vector DB**: `./scripts/test-vector-db.sh`
4. **View Logs**: `tail -f backend.log frontend.log`
5. **Make Changes**: Files are watched and auto-reload
6. **Stop When Done**: `./scripts/dev-down.sh`

## Production Deployment

1. **Build and Start**: `./scripts/prod-up.sh`
2. **Monitor Logs**: `docker-compose -f docker-compose.prod.yml logs -f`
3. **Health Check**: `curl http://localhost/health`
4. **Stop**: `./scripts/prod-down.sh`

## Notes

- All scripts include comprehensive error handling
- Vector database functionality is fully tested
- Both environments support the complete IRIS+ framework
- Production includes automated backup scheduling
- Development includes hot reload and debugging features