#!/bin/bash

# Vector Database Test Script
set -e

echo "🧪 Testing pgvector Database Configuration..."

# Check if development environment is running
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "impact-bot-postgres-dev"; then
    echo "❌ Development environment is not running. Please run ./scripts/dev-up.sh first."
    exit 1
fi

# Test vector extension
echo "🔍 Testing vector extension availability..."
VECTOR_CHECK=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d impact_bot_dev -c "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector');" -t 2>/dev/null | tr -d ' ')

if [ "$VECTOR_CHECK" = "t" ]; then
    echo "✅ pgvector extension is installed"
else
    echo "❌ pgvector extension is NOT installed"
    exit 1
fi

# Test vector operations
echo "🔍 Testing vector operations..."
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d impact_bot_dev -c "
    -- Create a test table with vector column
    DROP TABLE IF EXISTS vector_test;
    CREATE TABLE vector_test (
        id SERIAL PRIMARY KEY,
        embedding vector(3)
    );
    
    -- Insert test data
    INSERT INTO vector_test (embedding) VALUES 
        ('[1,2,3]'),
        ('[4,5,6]'),
        ('[7,8,9]');
    
    -- Test vector similarity search
    SELECT id, embedding, embedding <-> '[2,3,4]' AS distance 
    FROM vector_test 
    ORDER BY embedding <-> '[2,3,4]' 
    LIMIT 2;
    
    -- Clean up
    DROP TABLE vector_test;
" > /tmp/vector_test_output.txt 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Vector operations test passed"
    echo "📊 Test results:"
    cat /tmp/vector_test_output.txt | grep -A 5 "id | embedding"
    rm -f /tmp/vector_test_output.txt
else
    echo "❌ Vector operations test failed"
    cat /tmp/vector_test_output.txt
    rm -f /tmp/vector_test_output.txt
    exit 1
fi

# Test Prisma schema with vector types
echo "🔍 Testing Prisma schema validation..."
cd backend
if npx prisma validate > /tmp/prisma_validate.txt 2>&1; then
    echo "✅ Prisma schema validation passed"
else
    echo "❌ Prisma schema validation failed:"
    cat /tmp/prisma_validate.txt
    rm -f /tmp/prisma_validate.txt
    exit 1
fi
rm -f /tmp/prisma_validate.txt

# Test Prisma client generation
echo "🔍 Testing Prisma client generation..."
if npx prisma generate > /tmp/prisma_generate.txt 2>&1; then
    echo "✅ Prisma client generation passed"
else
    echo "❌ Prisma client generation failed:"
    cat /tmp/prisma_generate.txt
    rm -f /tmp/prisma_generate.txt
    exit 1
fi
rm -f /tmp/prisma_generate.txt

cd ..

echo "🎉 All vector database tests passed!"
echo "📋 Test Summary:"
echo "  ✅ pgvector extension installed"
echo "  ✅ Vector operations working"
echo "  ✅ Prisma schema valid"
echo "  ✅ Prisma client generation working"
echo ""
echo "🚀 Vector database is ready for use!"