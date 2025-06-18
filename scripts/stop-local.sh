#!/bin/bash

# Impact Bot v2 - Stop Local Development Script
# This script stops all running services

echo "🛑 Stopping Impact Bot v2 Development Environment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop Node.js processes
echo "Stopping Node.js services..."
echo "---------------------------"

# Find and kill backend process
BACKEND_PIDS=$(lsof -ti:3003 2>/dev/null)
if [ ! -z "$BACKEND_PIDS" ]; then
    echo -n "Stopping backend (PID: $BACKEND_PIDS)... "
    kill -9 $BACKEND_PIDS 2>/dev/null
    echo -e "${GREEN}✓${NC}"
else
    echo "Backend not running"
fi

# Find and kill frontend process
FRONTEND_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo -n "Stopping frontend (PID: $FRONTEND_PIDS)... "
    kill -9 $FRONTEND_PIDS 2>/dev/null
    echo -e "${GREEN}✓${NC}"
else
    echo "Frontend not running"
fi

# Kill any tsx processes
TSX_PIDS=$(ps aux | grep tsx | grep -v grep | awk '{print $2}')
if [ ! -z "$TSX_PIDS" ]; then
    echo -n "Stopping tsx processes... "
    echo $TSX_PIDS | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC}"
fi

# Kill any react-scripts processes
REACT_PIDS=$(ps aux | grep react-scripts | grep -v grep | awk '{print $2}')
if [ ! -z "$REACT_PIDS" ]; then
    echo -n "Stopping react-scripts processes... "
    echo $REACT_PIDS | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC}"
fi

echo ""
echo "Stopping Docker services..."
echo "---------------------------"

# Stop Docker Compose services
docker compose stop

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
echo "💡 To completely remove Docker containers and volumes:"
echo "   docker compose down -v"
echo ""
echo "To restart services:"
echo "   ./scripts/start-local.sh"