# Impact Bot v2 - Local Development Setup

## 🚀 Quick Start

```bash
# Start all services
./scripts/start-local.sh

# Check environment health
./scripts/check-environment.sh

# Stop all services
./scripts/stop-local.sh
```

## 📋 Prerequisites

1. **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop)
2. **Node.js v18+**: [Download here](https://nodejs.org/)
3. **Git**: For version control

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   PostgreSQL    │
│   (Port 3000)   │     │   (Port 3003)   │     │   (Port 5434)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         ▲
                                ▼                         │
                        ┌─────────────────┐     ┌─────────────────┐
                        │     Redis       │     │    pgvector     │
                        │   (Port 6380)   │     │   (Extension)   │
                        └─────────────────┘     └─────────────────┘
```

## 🛠️ Manual Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/impact-bot-mvp-2.git
cd impact-bot-mvp-2
```

### 2. Environment Configuration
```bash
# Copy example environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your configuration
# - Add your Anthropic API key to backend/.env
# - Update any other settings as needed
```

### 3. Start Docker Services
```bash
# Start PostgreSQL and Redis
docker compose up -d database cache

# Verify services are running
docker compose ps
```

### 4. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 5. Run Database Migrations
```bash
cd backend
npm run db:migrate
npm run db:seed  # Optional: Load sample data
```

### 6. Start Development Servers
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```

## 🔍 Service Details

### PostgreSQL Database
- **Port**: 5434 (non-standard to avoid conflicts)
- **Database**: impactbot_v2
- **Username**: postgres
- **Password**: secure_production_password_2024
- **Extensions**: pgvector (for AI embeddings)

### Redis Cache
- **Port**: 6380 (non-standard to avoid conflicts)
- **Purpose**: Session management, API caching

### Backend API
- **Port**: 3003
- **Framework**: Express.js with TypeScript
- **Features**: 
  - RESTful API
  - JWT authentication
  - Anthropic Claude integration
  - IRIS+ framework data

### Frontend
- **Port**: 3000
- **Framework**: React with TypeScript
- **Features**:
  - Material-UI components
  - Redux state management
  - Real-time updates

## 📝 Common Tasks

### View Logs
```bash
# Docker services
docker compose logs -f database
docker compose logs -f cache

# Application logs
# Backend logs appear in terminal
# Frontend logs appear in browser console
```

### Database Access
```bash
# Connect to PostgreSQL
PGPASSWORD=secure_production_password_2024 psql -h localhost -p 5434 -U postgres -d impactbot_v2

# Common queries
\dt                    # List tables
\d+ table_name         # Describe table
SELECT * FROM users;   # Query data
```

### Redis Access
```bash
# Connect to Redis
redis-cli -p 6380

# Common commands
KEYS *          # List all keys
GET key         # Get value
FLUSHALL        # Clear cache (careful!)
```

### Reset Database
```bash
# Stop services
./scripts/stop-local.sh

# Remove volumes
docker compose down -v

# Restart and re-run migrations
./scripts/start-local.sh
cd backend && npm run db:migrate
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker compose ps database

# Check logs
docker compose logs database

# Restart service
docker compose restart database
```

### Backend Won't Start
```bash
# Check TypeScript compilation
cd backend && npm run build

# Check environment variables
cat backend/.env

# Run with debug logging
LOG_LEVEL=debug npm run dev
```

### Frontend Build Issues
```bash
# Clear cache
cd frontend
rm -rf node_modules
npm install

# Check for TypeScript errors
npm run build
```

## 🚢 Docker Compose Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose stop

# Remove all containers
docker compose down

# Remove containers and volumes
docker compose down -v

# View service logs
docker compose logs -f [service]

# Restart a service
docker compose restart [service]

# Execute command in container
docker compose exec [service] [command]
```

## 🔐 Security Notes

1. **Never commit .env files** - They contain sensitive credentials
2. **Change default passwords** before deploying to production
3. **Keep API keys secure** - Rotate them regularly
4. **Use HTTPS** in production environments

## 📚 Additional Resources

- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Database Schema](./docs/DATABASE.md)
- [API Endpoints](./docs/API.md)

## 💡 Tips

1. **Hot Reloading**: Both frontend and backend support hot reloading
2. **TypeScript**: Use `npm run type-check` to verify types
3. **Linting**: Run `npm run lint` before committing
4. **Testing**: Run `npm test` to execute test suites

## 🆘 Need Help?

1. Check the logs first
2. Run `./scripts/check-environment.sh`
3. Review error messages carefully
4. Check GitHub issues
5. Contact the development team

---

Happy coding! 🎉