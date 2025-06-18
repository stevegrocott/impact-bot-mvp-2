#!/bin/bash

# Environment Status Script
echo "📊 Impact Bot Environment Status"
echo "================================="

# Check Docker
echo ""
echo "🐳 Docker Services:"
echo "Development:"
if docker-compose -f docker-compose.dev.yml ps 2>/dev/null | grep -q "Up"; then
    echo "  ✅ Development services running"
    docker-compose -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | grep -v "^NAME"
else
    echo "  ❌ Development services not running"
fi

echo ""
echo "Production:"
if docker-compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
    echo "  ✅ Production services running"
    docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | grep -v "^NAME"
else
    echo "  ❌ Production services not running"
fi

# Check Node processes
echo ""
echo "🟢 Node.js Processes:"
if ps aux | grep -E "(tsx.*index.ts|react-scripts start|simple-start.js)" | grep -v grep > /dev/null; then
    ps aux | grep -E "(tsx.*index.ts|react-scripts start|simple-start.js)" | grep -v grep | awk '{print "  " $2, $11, $12, $13}'
else
    echo "  ❌ No Node.js processes running"
fi

# Check PID files
echo ""
echo "📁 PID Files:"
if [ -f /tmp/impact-bot-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/impact-bot-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "  ✅ Backend PID: $BACKEND_PID (running)"
    else
        echo "  ⚠️ Backend PID: $BACKEND_PID (not running - stale PID file)"
    fi
else
    echo "  ❌ No backend PID file"
fi

if [ -f /tmp/impact-bot-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/impact-bot-frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "  ✅ Frontend PID: $FRONTEND_PID (running)"
    else
        echo "  ⚠️ Frontend PID: $FRONTEND_PID (not running - stale PID file)"
    fi
else
    echo "  ❌ No frontend PID file"
fi

# Check services
echo ""
echo "🌐 Service Health:"
echo "Frontend (http://localhost:3000):"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Responding"
else
    echo "  ❌ Not responding"
fi

echo "Backend (http://localhost:3003):"
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "  ✅ Responding"
    HEALTH=$(curl -s http://localhost:3003/health | jq -r '.status' 2>/dev/null || echo "unknown")
    echo "  📊 Health: $HEALTH"
else
    echo "  ❌ Not responding"
fi

echo "PgAdmin (http://localhost:5050):"
if curl -s http://localhost:5050 > /dev/null 2>&1; then
    echo "  ✅ Responding"
else
    echo "  ❌ Not responding"
fi

# Vector database check
echo ""
echo "🔬 Vector Database:"
if docker-compose -f docker-compose.dev.yml ps | grep -q "impact-bot-postgres-dev.*Up"; then
    VECTOR_CHECK=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d impact_bot_dev -c "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector');" -t 2>/dev/null | tr -d ' ' || echo "f")
    if [ "$VECTOR_CHECK" = "t" ]; then
        echo "  ✅ pgvector extension installed"
    else
        echo "  ❌ pgvector extension not found"
    fi
else
    echo "  ❌ PostgreSQL not running"
fi

echo ""
echo "📋 Quick Actions:"
echo "  Start Development: ./scripts/dev-up.sh"
echo "  Stop Development:  ./scripts/dev-down.sh"
echo "  Start Production:  ./scripts/prod-up.sh"
echo "  Stop Production:   ./scripts/prod-down.sh"
echo "  Test Vector DB:    ./scripts/test-vector-db.sh"