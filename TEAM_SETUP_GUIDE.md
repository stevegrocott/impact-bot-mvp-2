# Team Setup Guide - Impact Bot v2

## 🚀 Quick Start for New Developers

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### 1. Clone & Branch Setup
```bash
# Clone the repository
git clone https://github.com/stevegrocott/impact-bot-mvp-2.git
cd impact-bot-mvp-2

# Create your development branch
git checkout -b feature/your-feature-name

# Or for shared development
git checkout -b dev/your-name
```

### 2. Environment Setup
```bash
# Copy environment files (already configured)
# .env.development and frontend/.env.development are ready to use

# Start the development environment
docker-compose up -d

# This automatically:
# - Creates isolated dev database (postgres_dev_data volume)
# - Creates isolated dev cache (redis_dev_data volume)  
# - Loads test data including demo user
# - Runs on ports 5434 (DB) and 6380 (Redis)
```

### 3. Start Development Services
```bash
# Backend (in separate terminal)
cd backend
npm install
npm run dev  # Starts on http://localhost:3003

# Frontend (in separate terminal)  
cd frontend
npm install
npm start    # Starts on http://localhost:3000
```

### 4. Test Authentication
- Open http://localhost:3000
- Login with: `demo@impact-bot.com` / `demo123`
- Verify you can access the dashboard

## 🔧 Development Workflow

### Before Making Changes
```bash
# Always validate current setup works
./scripts/validate-deployment.sh

# Create backup before major changes
./database/backup-restore.sh backup_db
```

### During Development
```bash
# Backend syntax check
cd backend && npm run build

# Frontend syntax check  
cd frontend && npm run build

# Run integration tests
npm run test:integration
```

### Before Committing
```bash
# Validate everything works
./scripts/validate-deployment.sh

# Follow the commit rules in DEVELOPMENT_RULES.md
```

## 🗄️ Data Management for Developers

### Your Development Data
- **Isolated**: Your dev environment uses separate volumes
- **Persistent**: Data survives container restarts
- **Test Data**: Includes demo user and sample conversations
- **Safe**: Won't affect other environments

### Working with Database
```bash
# View your data
docker exec impactbot-v2-database psql -U postgres -d impactbot_v2_dev -c "SELECT email, first_name FROM users;"

# Create backup of your work
./database/backup-restore.sh backup_db

# Apply database migrations
./database/migration-workflow.sh apply migrations/your_migration.sql

# Rollback if needed
./database/migration-workflow.sh rollback
```

## 🌍 Environment Isolation

| Environment | Database | Ports | Data |
|-------------|----------|--------|------|
| **Development** | `impactbot_v2_dev` | 5434, 6380 | Test data included |
| **Test** | `impactbot_v2_test` | 5435, 6381 | Clean for each test |
| **Production** | `impactbot_v2_prod` | Internal only | Production data |

### Switch Environments
```bash
# Development (default)
docker-compose up -d

# Test environment
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Production (when ready)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Run Full Test Suite
```bash
# Integration tests
npm run test:integration

# Frontend tests  
cd frontend && npm test

# Backend tests
cd backend && npm test

# End-to-end validation
./scripts/validate-deployment.sh
```

### Test Specific Features
```bash
# Test authentication flow
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@impact-bot.com","password":"demo123"}'

# Test protected routes
TOKEN="your_jwt_token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/user/profile
```

## 🔧 Common Development Tasks

### Add New Controller
```bash
# Use existing controllers as templates
cp backend/src/controllers/userController.ts backend/src/controllers/newController.ts
# Update routes in backend/src/routes/index.ts
```

### Add Database Migration
```bash
# Create migration template
./database/migration-workflow.sh create add_new_feature

# Edit the generated files in database/migrations/
# Apply with safety checks
./database/migration-workflow.sh apply migrations/20240618_add_new_feature.sql
```

### Frontend Component Development
```bash
# Components are in frontend/src/components/
# Pages are in frontend/src/pages/
# Follow existing patterns and use Tailwind CSS
```

## 🚨 Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
lsof -ti:3000,3003,5434,6380

# Kill conflicting processes
kill $(lsof -ti:3000)
```

### Database Issues
```bash
# Reset development database
docker-compose down
docker volume rm impact-bot-mvp-2_postgres_dev_data
docker-compose up -d database

# Restore from backup
./database/backup-restore.sh restore_db backups/your_backup.sql.gz
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install
cd frontend && npm install

# Clear Docker cache
docker system prune -f
```

## 📋 Development Best Practices

### ✅ Do This
- Create feature branches for all work
- Run validation scripts before commits
- Back up before major database changes
- Use environment-specific configurations
- Follow TypeScript strict mode
- Write tests for new features

### ❌ Don't Do This  
- Work directly on main branch
- Skip build validation
- Use production environment for development
- Commit without testing
- Ignore TypeScript errors
- Skip backup before migrations

## 🤝 Team Collaboration

### Branch Strategy
```bash
# Feature development
git checkout -b feature/user-dashboard
git push -u origin feature/user-dashboard

# Collaborative development
git checkout -b dev/john-auth-improvements
git push -u origin dev/john-auth-improvements
```

### Code Review Process
1. Create feature branch
2. Run validation: `./scripts/validate-deployment.sh`
3. Commit with descriptive messages
4. Push to GitHub
5. Create Pull Request
6. Team review and merge

## 📞 Getting Help

### Check Documentation
- `DATA_MANAGEMENT_GUIDE.md` - Database and data lifecycle
- `DEVELOPMENT_RULES.md` - Coding workflow rules
- `LOCAL_SETUP.md` - Detailed setup instructions

### Validate Your Setup
```bash
# Full system validation
./scripts/validate-deployment.sh

# Quick health check
curl http://localhost:3003/health
```

### Common Issues & Solutions
- **Database connection fails**: Check Docker containers running
- **Frontend won't load**: Verify backend is running on port 3003
- **Authentication fails**: Check demo user exists in database
- **Build errors**: Ensure all dependencies installed

---

**Ready to develop!** 🎉

Your development environment is isolated, backed up, and ready for team collaboration.