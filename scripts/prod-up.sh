#!/bin/bash

# Production Environment Startup Script
set -e

echo "🚀 Starting Impact Bot Production Environment..."

# Stop development services first
echo "🔧 Stopping development services..."
./scripts/dev-down.sh 2>/dev/null || echo "No development services running"

# Clean up any existing production containers
echo "🧹 Cleaning up existing production containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build production images
echo "🏗️ Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start production services
echo "📦 Starting production services with pgvector support..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
echo "Waiting for PostgreSQL with pgvector..."
until docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres; do
  echo "PostgreSQL not ready, waiting..."
  sleep 2
done

echo "Waiting for Redis..."
until docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping 2>/dev/null; do
  echo "Redis not ready, waiting..."
  sleep 2
done

# Verify vector extension is available
echo "🔍 Verifying pgvector extension in production..."
VECTOR_CHECK=$(docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d impact_bot_prod -c "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector');" -t 2>/dev/null | tr -d ' ' || echo "f")

if [ "$VECTOR_CHECK" = "f" ]; then
    echo "❌ pgvector extension not found. Installing..."
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d impact_bot_prod -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || echo "Failed to create vector extension"
fi

# Run database migrations/schema push for production
echo "🗃️ Deploying database schema with vector support..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy 2>/dev/null || {
    echo "Migration failed, trying schema push instead..."
    docker-compose -f docker-compose.prod.yml exec backend npx prisma db push
}

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Health check
echo "🔍 Performing health check..."
HEALTH_CHECK=$(curl -s http://localhost/health 2>/dev/null || echo "failed")
if [ "$HEALTH_CHECK" = "failed" ]; then
    echo "⚠️ Health check failed, but services may still be starting..."
else
    echo "✅ Health check passed!"
fi

echo "🎉 Production environment is running!"
echo "Application: http://localhost"
echo "Health Check: http://localhost/health"
echo "Database: PostgreSQL with pgvector (internal)"
echo "Redis: Redis (internal)"

echo "💡 To stop production environment, run: ./scripts/prod-down.sh"
echo "💡 To view logs, run: docker-compose -f docker-compose.prod.yml logs -f"
echo "💡 To view specific service logs: docker-compose -f docker-compose.prod.yml logs -f [postgres|redis|backend|frontend]"