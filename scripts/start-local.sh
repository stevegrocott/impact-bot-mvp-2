#!/bin/bash

# Impact Bot v2 - Local Development Startup Script
# This script starts all required services for local development

echo "🚀 Starting Impact Bot v2 Development Environment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

if ! command_exists docker; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker installed"
echo -e "${GREEN}✓${NC} Node.js installed ($(node --version))"
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
echo "------------------------------"

# Remove old version attribute warning
if grep -q "^version:" docker-compose.yml 2>/dev/null; then
    echo "Removing deprecated version attribute from docker-compose.yml..."
    sed -i.bak '/^version:/d' docker-compose.yml
fi

# Start only database and cache services
docker compose up -d database cache

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check database
echo -n "PostgreSQL: "
if nc -zv localhost 5434 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ready${NC}"
else
    echo -e "${RED}✗ Not ready${NC}"
    echo "Checking logs..."
    docker compose logs database --tail 20
fi

# Check Redis
echo -n "Redis: "
if nc -zv localhost 6380 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ready${NC}"
else
    echo -e "${RED}✗ Not ready${NC}"
    echo "Checking logs..."
    docker compose logs cache --tail 20
fi

echo ""
echo "📦 Installing dependencies..."
echo "-----------------------------"

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
else
    echo -e "${GREEN}✓${NC} Backend dependencies already installed"
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
else
    echo -e "${GREEN}✓${NC} Frontend dependencies already installed"
fi

echo ""
echo "🚀 Starting application services..."
echo "-----------------------------------"

# Kill any existing processes on our ports
echo "Cleaning up any existing processes..."
lsof -ti:3003 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start backend in background
echo ""
echo -e "${BLUE}Starting Backend API...${NC}"
echo "Backend will run on http://localhost:3003"
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend in background
echo ""
echo -e "${BLUE}Starting Frontend...${NC}"
echo "Frontend will run on http://localhost:3000"
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

# Wait for services to start
sleep 10

echo ""
echo "✅ All services started!"
echo ""
echo "📌 Service URLs:"
echo "----------------"
echo -e "Frontend:    ${BLUE}http://localhost:3000${NC}"
echo -e "Backend API: ${BLUE}http://localhost:3003${NC}"
echo -e "PostgreSQL:  ${BLUE}localhost:5434${NC}"
echo -e "Redis:       ${BLUE}localhost:6380${NC}"
echo ""
echo "📝 Process IDs:"
echo "---------------"
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "💡 Tips:"
echo "--------"
echo "• View logs: docker compose logs -f [service]"
echo "• Stop all: ./scripts/stop-local.sh"
echo "• Check health: ./scripts/check-environment.sh"
echo "• Frontend hot-reloads automatically"
echo "• Backend restarts on file changes"
echo ""
echo -e "${GREEN}✨ Happy developing!${NC}"
echo ""
echo "Press Ctrl+C to stop all services..."

# Keep script running
wait $BACKEND_PID $FRONTEND_PID