#!/bin/bash

# Development Environment Shutdown Script
set -e

echo "🛑 Stopping Impact Bot Development Environment..."

# Stop Node.js processes
if [ -f /tmp/impact-bot-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/impact-bot-backend.pid)
    echo "🔧 Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || echo "Backend already stopped"
    rm /tmp/impact-bot-backend.pid
fi

if [ -f /tmp/impact-bot-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/impact-bot-frontend.pid)
    echo "🎨 Stopping frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || echo "Frontend already stopped"
    rm /tmp/impact-bot-frontend.pid
fi

# Stop any remaining Node processes for this project
echo "🧹 Cleaning up any remaining processes..."
pkill -f "impact-bot" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "tsx.*index.ts" 2>/dev/null || true
pkill -f "simple-start.js" 2>/dev/null || true

# Stop Docker services
echo "📦 Stopping development services..."
docker-compose -f docker-compose.dev.yml down --remove-orphans

# Clean up log files
echo "📝 Cleaning up log files..."
rm -f backend.log frontend.log 2>/dev/null || true

echo "✅ Development environment stopped successfully!"