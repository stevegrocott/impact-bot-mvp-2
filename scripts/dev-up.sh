#!/bin/bash

# Development Environment Startup Script
set -e

echo "🚀 Starting Impact Bot Development Environment..."

# Stop any existing processes
echo "🛑 Stopping any existing processes..."
./scripts/dev-down.sh 2>/dev/null || true

# Clean up any existing Docker containers to ensure fresh start
echo "🧹 Cleaning up existing Docker containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Start development services (database/redis with vector support)
echo "🔧 Starting development services with pgvector support..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
echo "Waiting for PostgreSQL with pgvector..."
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres 2>/dev/null; do
  echo "PostgreSQL not ready, waiting..."
  sleep 2
done

echo "Waiting for Redis..."
until docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping 2>/dev/null; do
  echo "Redis not ready, waiting..."
  sleep 2
done

# Verify vector extension is available
echo "🔍 Verifying pgvector extension..."
VECTOR_CHECK=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d impact_bot_dev -c "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector');" -t 2>/dev/null | tr -d ' ' || echo "f")

if [ "$VECTOR_CHECK" = "f" ]; then
    echo "❌ pgvector extension not found. Installing..."
    docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d impact_bot_dev -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || echo "Failed to create vector extension"
fi

echo "✅ Docker services are ready with pgvector support!"

# Navigate to backend and start
echo "🔧 Setting up backend..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Generate Prisma client with hybrid schema (vector support)
echo "Generating Prisma client with vector support..."
npx prisma generate

# Push database schema with vector extensions
echo "Synchronizing database schema with vector support..."
npx prisma db push --force-reset

# Seed basic data if needed
echo "Seeding initial data..."
npm run db:seed 2>/dev/null || echo "Seed data already exists or seed script not available"

# Start backend in background
echo "Starting backend development server..."
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Navigate to frontend and start
echo "🎨 Setting up frontend..."
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
echo "Starting frontend development server..."
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "🎉 Development environment is running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3003"
echo "PgAdmin: http://localhost:5050 (admin@impact-bot.com / admin)"
echo "Database: PostgreSQL with pgvector on port 5432"
echo "Redis: Redis on port 6379"

# Create PID files for cleanup
echo $BACKEND_PID > /tmp/impact-bot-backend.pid
echo $FRONTEND_PID > /tmp/impact-bot-frontend.pid

echo "💡 To stop development environment, run: ./scripts/dev-down.sh"
echo "💡 To view logs: tail -f backend.log frontend.log"

# Wait for services to start
sleep 3
echo "✅ Development environment startup complete!"