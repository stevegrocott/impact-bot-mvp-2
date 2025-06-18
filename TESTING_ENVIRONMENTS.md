# Testing Environments Guide

## 🌍 Environment Overview

| Environment | Frontend | Backend | Database | Purpose |
|-------------|----------|---------|----------|---------|
| **Development** | :3000 | :3003 | `impactbot_v2_dev` | Your testing (localhost:3000) |
| **Test** | :3001 | :3004 | `impactbot_v2_test` | CI/CD and team testing |
| **Production** | :80 | :3003 | `impactbot_v2_prod` | Live deployment |

## 🧪 Your Testing Environment (Port 3000)

**You are testing on: Development Environment**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **Database**: `impactbot_v2_dev` (separate from production)
- **Test User**: `demo@impact-bot.com` / `demo123`

### Start Development Environment:
```bash
# Start infrastructure
docker-compose up -d

# Start backend
cd backend && npm run dev

# Start frontend (separate terminal)
cd frontend && npm start
```

## 🔄 Switching Environments

### Development (Default)
```bash
docker-compose up -d
# Uses docker-compose.override.yml automatically
```

### Test Environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
```

### Production Environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🛡️ Validation Commands

### Before Any Testing
```bash
# Quick validation
./scripts/pre-commit-validation.sh

# Comprehensive validation
./scripts/validate-deployment-enhanced.sh development
./scripts/validate-deployment-enhanced.sh test
./scripts/validate-deployment-enhanced.sh production
```

### Environment-Specific Testing
```bash
# Test your environment (development)
curl http://localhost:3000

# Test backend health
curl http://localhost:3003/health

# Test authentication
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@impact-bot.com","password":"demo123"}'
```

## 🚨 Validation Levels

### Level 1: Pre-Commit (MANDATORY)
- TypeScript compilation
- Basic syntax validation
- Environment file checks
- Runs automatically on `git commit`

### Level 2: Deployment Validation
- Full build verification
- Database connectivity
- Authentication flow
- Multi-environment testing

### Level 3: Integration Testing
- End-to-end user flows
- Cross-browser compatibility
- Performance validation
- Production readiness

## 🔧 Troubleshooting

### Port 3000 Not Working?
1. Check if frontend is running: `npm start` in frontend directory
2. Check if backend is running: `curl http://localhost:3003/health`
3. Verify Docker services: `docker-compose ps`
4. Run validation: `./scripts/validate-deployment-enhanced.sh development`

### TypeScript Errors?
1. Run build check: `cd backend && npm run build`
2. Fix all compilation errors
3. Re-run validation: `./scripts/pre-commit-validation.sh`

### Database Connection Issues?
1. Check database: `docker exec impactbot-v2-database psql -U postgres -d impactbot_v2_dev -c "SELECT current_database();"`
2. Verify test user: `docker exec impactbot-v2-database psql -U postgres -d impactbot_v2_dev -c "SELECT email FROM users;"`
3. Reset if needed: `docker-compose down && docker volume rm impact-bot-mvp-2_postgres_dev_data && docker-compose up -d`

## 📋 Environment Checklist

### ✅ Development Ready
- [ ] Docker services healthy
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Database has test user
- [ ] http://localhost:3000 accessible
- [ ] Authentication works

### ✅ Test Ready
- [ ] All development checks pass
- [ ] Test database isolated
- [ ] CI/CD pipeline passes
- [ ] Integration tests pass

### ✅ Production Ready
- [ ] All test checks pass
- [ ] Performance benchmarks met
- [ ] Security validation complete
- [ ] Backup/recovery tested