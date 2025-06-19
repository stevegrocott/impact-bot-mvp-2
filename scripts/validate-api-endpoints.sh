#!/bin/bash

# API Endpoint Validation Script
# Validates all backend services that the frontend needs

set -e

echo "🚀 API Endpoint Validation for Frontend Integration"
echo "=================================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=${BACKEND_URL:-"http://localhost:3003"}
TEST_EMAIL="api-test@validation.com"
TEST_PASSWORD="TestPassword123!"
TEST_ORG_NAME="API Validation Test Org"

echo -e "${BLUE}Backend URL: $BACKEND_URL${NC}"
echo ""

# Helper function to make authenticated requests
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local auth_header="$4"
    
    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            curl -s -X "$method" "$BACKEND_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data"
        else
            curl -s -X "$method" "$BACKEND_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    else
        if [ -n "$auth_header" ]; then
            curl -s -X "$method" "$BACKEND_URL$endpoint" \
                -H "Authorization: Bearer $auth_header"
        else
            curl -s -X "$method" "$BACKEND_URL$endpoint"
        fi
    fi
}

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local auth_token="$5"
    local expected_status="$6"
    
    echo -e "${YELLOW}Testing: $name${NC}"
    
    if [ -n "$data" ]; then
        if [ -n "$auth_token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_token" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -n "$auth_token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
                -H "Authorization: Bearer $auth_token")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint")
        fi
    fi
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $name (Status: $status_code)"
        if echo "$response_body" | jq -e '.success' >/dev/null 2>&1; then
            success=$(echo "$response_body" | jq -r '.success')
            if [ "$success" = "true" ]; then
                echo -e "   ${GREEN}✅ Success: true${NC}"
            else
                echo -e "   ${YELLOW}⚠️  Success: false${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - $name (Expected: $expected_status, Got: $status_code)"
        echo -e "   Response: $(echo "$response_body" | head -c 200)..."
        return 1
    fi
    echo ""
}

# Start backend health check
echo -e "${BLUE}🏥 Backend Health Check${NC}"
echo "----------------------"

if ! curl -s "$BACKEND_URL/health" | jq -e '.status == "ok"' >/dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running or unhealthy${NC}"
    echo "Please start the backend server with: npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Backend is healthy${NC}"
echo ""

# Authentication Layer Tests
echo -e "${BLUE}🔐 Authentication Layer${NC}"
echo "----------------------"

# Register test user
register_data=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD",
    "firstName": "API",
    "lastName": "Tester",
    "organizationName": "$TEST_ORG_NAME",
    "organizationDescription": "Test organization for API validation"
}
EOF
)

# Clean up existing test user if any
cleanup_response=$(make_request "DELETE" "/api/v1/auth/cleanup-test-user" "{\"email\": \"$TEST_EMAIL\"}")

# Register user
test_endpoint "User Registration" "POST" "/api/v1/auth/register" "$register_data" "" "201"

# Extract token from registration
auth_token=$(make_request "POST" "/api/v1/auth/register" "$register_data" | jq -r '.data.token // empty')

if [ -z "$auth_token" ]; then
    # Try login instead
    login_data=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD"
}
EOF
    )
    
    auth_response=$(make_request "POST" "/api/v1/auth/login" "$login_data")
    auth_token=$(echo "$auth_response" | jq -r '.data.token // empty')
fi

if [ -z "$auth_token" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authentication token obtained${NC}"
echo ""

# Organization Management Layer
echo -e "${BLUE}🏢 Organization Management Layer${NC}"
echo "------------------------------"

test_endpoint "Get Current Organization" "GET" "/api/v1/organizations/current" "" "$auth_token" "200"
test_endpoint "Get Organization Members" "GET" "/api/v1/organizations/current/members" "" "$auth_token" "200"

# Foundation & Theory of Change Layer
echo -e "${BLUE}🎯 Foundation & Theory of Change Layer${NC}"
echo "------------------------------------"

test_endpoint "Get Foundation Readiness" "GET" "/api/v1/foundation/readiness" "" "$auth_token" "200"
test_endpoint "Get Foundation Assessment" "GET" "/api/v1/foundation/assessment" "" "$auth_token" "200"

# Theory of Change test data
theory_data=$(cat <<EOF
{
    "vision": "API test vision",
    "mission": "API test mission",
    "targetPopulation": "API test users",
    "outcomes": [
        {
            "title": "Improved API functionality",
            "description": "APIs work correctly for frontend",
            "indicators": ["response_time", "success_rate"]
        }
    ]
}
EOF
)

test_endpoint "Update Theory of Change" "PUT" "/api/v1/theory-of-change" "$theory_data" "$auth_token" "200"
test_endpoint "Get Theory of Change" "GET" "/api/v1/theory-of-change" "" "$auth_token" "200"

# Indicator Management Layer
echo -e "${BLUE}📊 Indicator Management Layer${NC}"
echo "-----------------------------"

test_endpoint "Get IRIS+ Categories" "GET" "/api/v1/iris/categories" "" "$auth_token" "200"
test_endpoint "Search IRIS+ Indicators" "GET" "/api/v1/iris/indicators?search=education&limit=5" "" "$auth_token" "200"

# Custom indicator test data
indicator_data=$(cat <<EOF
{
    "name": "API Test Indicator",
    "description": "Custom indicator for API testing",
    "category": "custom",
    "unit": "percentage",
    "frequency": "monthly",
    "targetValue": 85
}
EOF
)

test_endpoint "Create Custom Indicator" "POST" "/api/v1/indicators/custom" "$indicator_data" "$auth_token" "201"

# Pitfall Prevention Layer
echo -e "${BLUE}⚠️ Pitfall Prevention Layer${NC}"
echo "--------------------------"

test_endpoint "Get Real-time Warnings" "GET" "/api/v1/warnings/real-time" "" "$auth_token" "200"
test_endpoint "Get Pitfall Detection" "GET" "/api/v1/pitfall-detection/analyze" "" "$auth_token" "200"

# Data Collection & Workflow Layer
echo -e "${BLUE}📈 Data Collection & Workflow Layer${NC}"
echo "----------------------------------"

test_endpoint "Get Data Collection Workflows" "GET" "/api/v1/workflows" "" "$auth_token" "200"
test_endpoint "Get Data Quality Rules" "GET" "/api/v1/validation/rules" "" "$auth_token" "200"

# Reporting & Analytics Layer
echo -e "${BLUE}📋 Reporting & Analytics Layer${NC}"
echo "-----------------------------"

test_endpoint "Get Stakeholder Profiles" "GET" "/api/v1/stakeholder-reporting/stakeholders" "" "$auth_token" "200"
test_endpoint "Get Report Templates" "GET" "/api/v1/stakeholder-reporting/templates" "" "$auth_token" "200"

# AI Personality Layer
echo -e "${BLUE}🤖 AI Personality Layer${NC}"
echo "----------------------"

test_endpoint "Get AI Personalities" "GET" "/api/v1/ai-personalities/personalities" "" "$auth_token" "200"
test_endpoint "Get Personality Recommendations" "GET" "/api/v1/ai-personalities/recommendations?phase=foundation&foundationReadiness=45" "" "$auth_token" "200"

# Cross-Org Learning Layer
echo -e "${BLUE}🧠 Cross-Org Learning Layer${NC}"
echo "--------------------------"

test_endpoint "Get Learning Insights" "GET" "/api/v1/cross-org-learning/insights" "" "$auth_token" "200"
test_endpoint "Get Benchmarking Data" "GET" "/api/v1/cross-org-learning/benchmarks?metrics=foundation_readiness" "" "$auth_token" "200"

# Knowledge Sharing Layer
echo -e "${BLUE}📚 Knowledge Sharing Layer${NC}"
echo "-------------------------"

test_endpoint "Search Knowledge Base" "GET" "/api/v1/knowledge-sharing/search?q=stakeholder" "" "$auth_token" "200"
test_endpoint "Get Best Practices" "GET" "/api/v1/knowledge-sharing/best-practices?page=1&limit=5" "" "$auth_token" "200"
test_endpoint "Get Trending Content" "GET" "/api/v1/knowledge-sharing/trending" "" "$auth_token" "200"

# External Integration Layer
echo -e "${BLUE}🔗 External Integration Layer${NC}"
echo "----------------------------"

test_endpoint "Get Data Source Types" "GET" "/api/v1/integration/data-sources" "" "$auth_token" "200"
test_endpoint "Get Field Mapping Options" "GET" "/api/v1/integration/field-mappings" "" "$auth_token" "200"

# Analytics & UX Support Layer
echo -e "${BLUE}🎨 Analytics & UX Support Layer${NC}"
echo "------------------------------"

test_endpoint "Get User Behavior Analytics" "GET" "/api/v1/analytics/user-behavior" "" "$auth_token" "200"

# Track interaction test data
track_data=$(cat <<EOF
{
    "eventType": "api_validation_test",
    "eventData": {
        "testType": "endpoint_validation",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
}
EOF
)

test_endpoint "Track User Interaction" "POST" "/api/v1/analytics/track" "$track_data" "$auth_token" "200"

# Summary
echo -e "${BLUE}📊 Validation Summary${NC}"
echo "===================="
echo -e "${GREEN}✅ All critical API endpoints validated${NC}"
echo -e "${GREEN}✅ Authentication layer working${NC}"
echo -e "${GREEN}✅ All major service layers responding${NC}"
echo -e "${GREEN}✅ Ready for frontend integration${NC}"
echo ""
echo -e "${BLUE}🎯 Frontend Integration Points:${NC}"
echo "• Authentication: /api/v1/auth/*"
echo "• Organizations: /api/v1/organizations/*"
echo "• Foundation: /api/v1/foundation/*"
echo "• Theory of Change: /api/v1/theory-of-change/*"
echo "• Indicators: /api/v1/iris/*, /api/v1/indicators/*"
echo "• Pitfall Prevention: /api/v1/warnings/*, /api/v1/pitfall-detection/*"
echo "• Data Collection: /api/v1/workflows/*, /api/v1/validation/*"
echo "• Reporting: /api/v1/stakeholder-reporting/*"
echo "• AI Personalities: /api/v1/ai-personalities/*"
echo "• Learning: /api/v1/cross-org-learning/*"
echo "• Knowledge: /api/v1/knowledge-sharing/*"
echo "• Integration: /api/v1/integration/*"
echo "• Analytics: /api/v1/analytics/*"
echo ""
echo -e "${GREEN}🎉 API validation completed successfully!${NC}"