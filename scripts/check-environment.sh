#!/bin/bash

# Impact Bot v2 - Environment Check Script
# This script verifies all backend services and configurations

echo "🔍 Impact Bot v2 - Environment Health Check"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_service() {
    local service=$1
    local check_command=$2
    local description=$3
    
    echo -n "Checking $description... "
    if eval $check_command > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Check Docker daemon
check_service "Docker" "docker info" "Docker daemon"

# Check Docker Compose version
echo -n "Docker Compose version: "
docker compose version 2>/dev/null || docker-compose --version

echo ""
echo "📦 Docker Services Status:"
echo "--------------------------"

# Check PostgreSQL
check_service "PostgreSQL" "nc -zv localhost 5434" "PostgreSQL (port 5434)"
if [ $? -eq 0 ]; then
    echo -n "  Database connectivity: "
    if PGPASSWORD=secure_production_password_2024 psql -h localhost -p 5434 -U postgres -d impactbot_v2 -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Connected${NC}"
    else
        echo -e "${RED}✗ Connection failed${NC}"
    fi
fi

# Check Redis
check_service "Redis" "nc -zv localhost 6380" "Redis (port 6380)"
if [ $? -eq 0 ]; then
    echo -n "  Cache connectivity: "
    if redis-cli -p 6380 ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PONG received${NC}"
    else
        echo -e "${RED}✗ No response${NC}"
    fi
fi

echo ""
echo "🚀 Application Services:"
echo "------------------------"

# Check Backend
check_service "Backend" "curl -s http://localhost:3003/health" "Backend API (port 3003)"
if [ $? -eq 0 ]; then
    echo -n "  API response: "
    response=$(curl -s http://localhost:3003/health)
    if [[ $response == *"ok"* ]] || [[ $response == *"healthy"* ]]; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Check response${NC}"
    fi
fi

# Check Frontend
check_service "Frontend" "curl -s http://localhost:3000" "Frontend (port 3000)"

echo ""
echo "📁 Docker Volumes:"
echo "------------------"
docker volume ls --filter name=impact-bot | grep -v DRIVER | tail -n +2

echo ""
echo "🔗 Docker Networks:"
echo "-------------------"
docker network ls --filter name=impactbot | grep -v DRIVER | tail -n +2

echo ""
echo "🏃 Running Processes:"
echo "---------------------"
# Check for Node.js processes
echo "Node.js processes:"
ps aux | grep -E "node|tsx" | grep -v grep | awk '{print $2, $11, $12}' | head -5

echo ""
echo "📋 Environment Files:"
echo "---------------------"
for env_file in ".env" "backend/.env" "frontend/.env"; do
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}✓${NC} $env_file exists"
    else
        echo -e "${RED}✗${NC} $env_file missing"
    fi
done

echo ""
echo "💾 Database Status:"
echo "-------------------"
if PGPASSWORD=secure_production_password_2024 psql -h localhost -p 5434 -U postgres -d impactbot_v2 -c "\dt" > /dev/null 2>&1; then
    echo "Tables in database:"
    PGPASSWORD=secure_production_password_2024 psql -h localhost -p 5434 -U postgres -d impactbot_v2 -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | grep -v '^$' | sed 's/^/  - /'
else
    echo -e "${RED}Unable to connect to database${NC}"
fi

echo ""
echo "🔍 Quick Diagnostics:"
echo "---------------------"

# Check if all required ports are available
for port in 3000 3003 5434 6380; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Port $port is in use (expected)"
    else
        echo -e "${YELLOW}⚠${NC} Port $port is not in use"
    fi
done

echo ""
echo "📝 Recommendations:"
echo "-------------------"

# Check if backend needs restart
if ! curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "• Backend is not responding. Try:"
    echo "  cd backend && npm run dev"
fi

# Check if frontend needs restart
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "• Frontend is not responding. Try:"
    echo "  cd frontend && npm start"
fi

# Check if Docker services need to be started
if ! docker compose ps | grep -q "Up"; then
    echo "• Some Docker services are not running. Try:"
    echo "  docker compose up -d database cache"
fi

echo ""
echo "✨ Environment check complete!"