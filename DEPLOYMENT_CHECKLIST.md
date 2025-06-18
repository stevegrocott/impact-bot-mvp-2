# Deployment Checklist - Engineering Best Practices

## 🚀 Pre-Deployment Validation (MANDATORY)

### Phase 1: Build Validation
- [ ] **Backend TypeScript**: `cd backend && npm run build` ✅ ZERO ERRORS
- [ ] **Frontend TypeScript**: `cd frontend && npm run build` ✅ ZERO ERRORS  
- [ ] **Linting**: Code quality passes all checks
- [ ] **Dependencies**: All packages installed and compatible

### Phase 2: Environment Validation
- [ ] **Environment Files**: All `.env` files present and valid
- [ ] **Docker Services**: Database and Redis healthy
- [ ] **Database Schema**: All tables exist and populated
- [ ] **Test Data**: Demo user exists and accessible

### Phase 3: Runtime Validation
- [ ] **Backend Health**: `/health` endpoint responds
- [ ] **Database Connection**: API can connect to database
- [ ] **Authentication**: Login flow works end-to-end
- [ ] **Protected Routes**: Authorization working

### Phase 4: Integration Validation
- [ ] **Frontend Access**: UI loads without errors
- [ ] **API Communication**: Frontend → Backend communication
- [ ] **Error Handling**: Graceful error responses
- [ ] **Cross-Environment**: Works in dev/test/prod

## 🛡️ Automated Validation Commands

### Quick Pre-Commit Check
```bash
./scripts/pre-commit-validation.sh
```

### Comprehensive Environment Testing
```bash
# Test development environment (your port 3000)
./scripts/validate-deployment-enhanced.sh development

# Test all environments
./scripts/validate-deployment-enhanced.sh test
./scripts/validate-deployment-enhanced.sh production
```

### Manual Testing Commands
```bash
# Health checks
curl http://localhost:3003/health
curl http://localhost:3000

# Authentication test
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@impact-bot.com","password":"demo123"}'
```

## 🔄 Environment-Specific Deployment

### Development Deployment
**Your testing environment (localhost:3000)**
```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Validate build
./scripts/pre-commit-validation.sh

# 3. Start services
cd backend && npm run dev &
cd frontend && npm start &

# 4. Validate deployment
./scripts/validate-deployment-enhanced.sh development
```

### Test Environment Deployment
```bash
# 1. Switch to test configuration
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# 2. Run comprehensive validation
./scripts/validate-deployment-enhanced.sh test

# 3. Run integration tests
npm run test:integration
```

### Production Deployment
```bash
# 1. Final validation in test environment
./scripts/validate-deployment-enhanced.sh test

# 2. Create backup
./database/backup-restore.sh backup

# 3. Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Validate production deployment
./scripts/validate-deployment-enhanced.sh production
```

## 🚨 Error Prevention Rules

### NEVER Commit Without:
1. ✅ TypeScript build passing (`npm run build`)
2. ✅ Pre-commit validation passing
3. ✅ Local testing on port 3000 working
4. ✅ Authentication flow tested

### NEVER Deploy Without:
1. ✅ All environments validated
2. ✅ Database backup created
3. ✅ Integration tests passing
4. ✅ Rollback plan prepared

### Git Hooks (Automatic):
- **Pre-commit**: Runs `./scripts/pre-commit-validation.sh`
- **Blocks commits** with TypeScript errors
- **Enforces** build validation before any commit

## 📊 Environment Status Dashboard

### Check Your Environment (Port 3000)
```bash
# Quick status check
echo "=== DEVELOPMENT ENVIRONMENT STATUS ==="
echo "Frontend: $(curl -s http://localhost:3000 >/dev/null && echo "✅ UP" || echo "❌ DOWN")"
echo "Backend:  $(curl -s http://localhost:3003/health >/dev/null && echo "✅ UP" || echo "❌ DOWN")"
echo "Database: $(docker exec impactbot-v2-database pg_isready -U postgres -d impactbot_v2_dev >/dev/null && echo "✅ UP" || echo "❌ DOWN")"
```

### Full Environment Report
```bash
./scripts/validate-deployment-enhanced.sh development | grep -E "(✅|❌|📍)"
```

## 🔧 Troubleshooting Guide

### TypeScript Build Errors
1. **Check**: `cd backend && npm run build`
2. **Fix**: All compilation errors must be resolved
3. **Validate**: Re-run `./scripts/pre-commit-validation.sh`
4. **Never**: Commit with TypeScript errors

### Port 3000 Not Working
1. **Backend**: Check `npm run dev` in backend directory
2. **Frontend**: Check `npm start` in frontend directory  
3. **Docker**: Verify `docker-compose ps` shows healthy services
4. **Database**: Test connection with validation script

### Database Connection Issues
1. **Container**: `docker exec impactbot-v2-database pg_isready`
2. **Schema**: Check tables exist in `impactbot_v2_dev`
3. **User**: Verify demo user exists
4. **Reset**: Last resort - recreate dev volumes

## ✅ Success Criteria

### Deployment Approved When:
- [ ] All validation scripts pass ✅
- [ ] TypeScript builds cleanly ✅
- [ ] Authentication works end-to-end ✅
- [ ] All environments tested ✅
- [ ] Team can access via GitHub ✅

### Your Testing (Port 3000) Works When:
- [ ] http://localhost:3000 loads ✅
- [ ] Login with demo@impact-bot.com works ✅
- [ ] Backend API responds on :3003 ✅
- [ ] Database queries succeed ✅
- [ ] No console errors ✅

This ensures the TypeScript build failures that blocked your testing will never happen again!