#!/bin/bash

# Production Environment Shutdown Script
set -e

echo "🛑 Stopping Impact Bot Production Environment..."

# Stop Docker services
echo "📦 Stopping production services..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

echo "✅ Production environment stopped successfully!"