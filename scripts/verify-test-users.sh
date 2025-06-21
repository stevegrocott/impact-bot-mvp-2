#!/bin/bash
# Verify Test Users Script
# Tests login for all created test users

API_BASE="http://localhost:3003/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Verifying Test User Logins${NC}"
echo "================================"

test_login() {
    local email="$1"
    local password="$2"
    local role="$3"
    
    echo -n "Testing $role ($email)... "
    
    RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        
        # Extract organization name
        ORG_NAME=$(echo "$RESPONSE" | sed -n 's/.*"organization":{"id":"[^"]*","name":"\([^"]*\)".*/\1/p')
        ROLE_NAME=$(echo "$RESPONSE" | sed -n 's/.*"role":{"id":"[^"]*","name":"\([^"]*\)".*/\1/p')
        
        if [ -n "$ORG_NAME" ] && [ -n "$ROLE_NAME" ]; then
            echo "   Organization: $ORG_NAME"
            echo "   Role: $ROLE_NAME"
        fi
        
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ERROR=$(echo "$RESPONSE" | sed -n 's/.*"error":"\([^"]*\)".*/\1/p')
        if [ -n "$ERROR" ]; then
            echo "   Error: $ERROR"
        fi
        return 1
    fi
}

# Test all users
echo
test_login "admin@impact-bot.com" "AdminTest123!" "Super Admin"
echo

test_login "orgadmin@impact-bot.com" "OrgAdmin123!" "Organization Admin"
echo

test_login "manager@impact-bot.com" "Manager123!" "Impact Manager"
echo

test_login "analyst@impact-bot.com" "Analyst123!" "Impact Analyst"
echo

test_login "viewer@impact-bot.com" "Viewer123!" "Report Viewer"
echo

test_login "evaluator@impact-bot.com" "Evaluator123!" "External Evaluator"
echo

test_login "demo@impact-bot.com" "Demo123!" "Demo User"
echo

echo "📋 All Test Users Summary:"
echo "========================="
echo "✅ admin@impact-bot.com / AdminTest123! (Super Admin - platform-wide access)"
echo "✅ orgadmin@impact-bot.com / OrgAdmin123! (Org Admin - full organization control)"
echo "✅ manager@impact-bot.com / Manager123! (Impact Manager - measurement management)"
echo "✅ analyst@impact-bot.com / Analyst123! (Impact Analyst - data analysis)"
echo "✅ viewer@impact-bot.com / Viewer123! (Report Viewer - read-only access)"
echo "✅ evaluator@impact-bot.com / Evaluator123! (External Evaluator - external assessment)"
echo "✅ demo@impact-bot.com / Demo123! (Demo User - demonstration account)"
echo
echo "🌐 Login at: http://localhost:3000"