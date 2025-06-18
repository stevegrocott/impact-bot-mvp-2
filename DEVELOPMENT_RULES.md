# Development & Integration Rules

## 🚨 MANDATORY VALIDATION BEFORE DEPLOYMENT

### Rule 1: Build Validation
```bash
# ALWAYS run before committing code changes
cd backend && npm run build
cd frontend && npm run build
```

### Rule 2: Service Health Check
```bash
# ALWAYS verify services start correctly
./scripts/validate-deployment.sh
```

### Rule 3: Integration Test
```bash
# ALWAYS run integration tests
npm run test:integration
```

## 🔄 WORKFLOW CHECKLIST

### Before Making Code Changes:
- [ ] Current system is working (run health check)
- [ ] Backup current working state
- [ ] Create feature branch

### After Making Code Changes:
- [ ] Backend builds without errors
- [ ] Frontend builds without errors  
- [ ] Backend starts successfully
- [ ] Authentication flow works
- [ ] Protected routes accessible
- [ ] Integration tests pass

### Before Claiming "Production Ready":
- [ ] Full validation script passes
- [ ] End-to-end user journey tested
- [ ] Database operations verified
- [ ] Error handling tested
- [ ] Performance acceptable

## 🚫 NEVER DO:
- ❌ Edit multiple files simultaneously without testing
- ❌ Make "quick fixes" without validation
- ❌ Claim system is working without actual testing
- ❌ Skip build validation steps
- ❌ Deploy without running health checks

## ✅ ALWAYS DO:
- ✅ Test every change immediately
- ✅ Validate builds before committing
- ✅ Run health checks after changes
- ✅ Document what you tested
- ✅ Verify claims with actual evidence

## 🛠️ Quick Commands:
```bash
# Full validation pipeline
./scripts/validate-deployment.sh

# Quick syntax check
npm run build

# Health check only
curl http://localhost:3003/health
```