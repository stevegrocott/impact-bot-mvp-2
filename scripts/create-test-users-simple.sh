#!/bin/bash
# Create Test Users Script - Simple Version
# Creates all standard test users for the Impact Bot organization

set -e

API_BASE="http://localhost:3003/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Creating Impact Bot Test Users${NC}"
echo "======================================"

ORGANIZATION_ID=""
SUCCESS_COUNT=0

# Function to register a user
register_user() {
    local email="$1"
    local password="$2"
    local first_name="$3"
    local last_name="$4"
    local job_title="$5"
    local org_name="$6"
    
    echo -n "👤 Creating user: $email... "
    
    # Create registration JSON
    cat > /tmp/register_user.json << EOF
{
    "email": "$email",
    "password": "$password",
    "firstName": "$first_name",
    "lastName": "$last_name",
    "jobTitle": "$job_title",
    "organization": {
        "name": "$org_name",
        "website": "https://impact-bot.com",
        "description": "AI-powered impact measurement platform organization"
    }
}
EOF
    
    # Attempt registration
    RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d @/tmp/register_user.json)
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        
        # Extract organization ID for the first user
        if [ -z "$ORGANIZATION_ID" ]; then
            ORGANIZATION_ID=$(echo "$RESPONSE" | sed -n 's/.*"organization":{"id":"\([^"]*\)".*/\1/p')
            echo "   📋 Organization ID: $ORGANIZATION_ID"
        fi
        
        return 0
    else
        # Check if user already exists
        if echo "$RESPONSE" | grep -q "already exists"; then
            echo -e "${YELLOW}⚠️  EXISTS${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            return 0
        else
            echo -e "${RED}❌ FAILED${NC}"
            ERROR=$(echo "$RESPONSE" | sed -n 's/.*"error":"\([^"]*\)".*/\1/p')
            echo "   Error: $ERROR"
            return 1
        fi
    fi
}

# Function to test login
test_login() {
    local email="$1"
    local password="$2"
    
    echo -n "🔐 Testing login: $email... "
    
    cat > /tmp/login_test.json << EOF
{
    "email": "$email",
    "password": "$password"
}
EOF
    
    RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d @/tmp/login_test.json)
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        
        # Extract role information
        ROLE=$(echo "$RESPONSE" | sed -n 's/.*"name":"\([^"]*\)","permissions".*/\1/p')
        if [ -n "$ROLE" ]; then
            echo "   👤 Role: $ROLE"
        fi
        
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Main execution
main() {
    # Check if backend is running
    if ! curl -s "http://localhost:3003/health" >/dev/null 2>&1; then
        echo -e "${RED}❌ Backend is not running on localhost:3003${NC}"
        echo "Please start the backend with: npm run dev:backend"
        exit 1
    fi
    
    echo "🏢 Creating Impact Bot organization and users..."
    echo
    
    # Create users one by one
    register_user "admin@impact-bot.com" "AdminTest123!" "Super" "Admin" "Platform Administrator" "Impact Bot"
    register_user "orgadmin@impact-bot.com" "OrgAdmin123!" "Organization" "Admin" "Organization Administrator" "Impact Bot"
    register_user "manager@impact-bot.com" "Manager123!" "Impact" "Manager" "Impact Measurement Manager" "Impact Bot"
    register_user "analyst@impact-bot.com" "Analyst123!" "Data" "Analyst" "Impact Data Analyst" "Impact Bot"
    register_user "viewer@impact-bot.com" "Viewer123!" "Report" "Viewer" "Stakeholder Report Viewer" "Impact Bot"
    register_user "evaluator@impact-bot.com" "Evaluator123!" "External" "Evaluator" "Independent Evaluator" "Impact Bot"
    register_user "demo@impact-bot.com" "Demo123!" "Demo" "User" "Demo Account" "Impact Bot"
    
    TOTAL_COUNT=7
    
    echo
    echo "🧪 Testing login functionality for all users..."
    echo
    
    # Test logins
    test_login "admin@impact-bot.com" "AdminTest123!"
    test_login "orgadmin@impact-bot.com" "OrgAdmin123!"
    test_login "manager@impact-bot.com" "Manager123!"
    test_login "analyst@impact-bot.com" "Analyst123!"
    test_login "viewer@impact-bot.com" "Viewer123!"
    test_login "evaluator@impact-bot.com" "Evaluator123!"
    test_login "demo@impact-bot.com" "Demo123!"
    
    echo
    echo "📊 Summary:"
    echo "==========="
    echo -e "Total users: $TOTAL_COUNT"
    echo -e "${GREEN}Successfully created/verified: $SUCCESS_COUNT${NC}"
    
    if [ -n "$ORGANIZATION_ID" ]; then
        echo -e "Organization: Impact Bot"
    fi
    
    echo
    echo "📋 Test User Credentials:"
    echo "========================"
    printf "%-15s | %-25s | %-15s | %s\n" "ROLE" "EMAIL" "PASSWORD" "NAME"
    echo "------------------------------------------------------------------------"
    printf "%-15s | %-25s | %-15s | %s\n" "super_admin" "admin@impact-bot.com" "AdminTest123!" "Super Admin"
    printf "%-15s | %-25s | %-15s | %s\n" "org_admin" "orgadmin@impact-bot.com" "OrgAdmin123!" "Organization Admin"
    printf "%-15s | %-25s | %-15s | %s\n" "impact_manager" "manager@impact-bot.com" "Manager123!" "Impact Manager"
    printf "%-15s | %-25s | %-15s | %s\n" "impact_analyst" "analyst@impact-bot.com" "Analyst123!" "Data Analyst"
    printf "%-15s | %-25s | %-15s | %s\n" "report_viewer" "viewer@impact-bot.com" "Viewer123!" "Report Viewer"
    printf "%-15s | %-25s | %-15s | %s\n" "evaluator" "evaluator@impact-bot.com" "Evaluator123!" "External Evaluator"
    printf "%-15s | %-25s | %-15s | %s\n" "impact_manager" "demo@impact-bot.com" "Demo123!" "Demo User"
    
    echo
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3003"
    echo
    echo "🔐 Super Admin Capabilities (admin@impact-bot.com):"
    echo "   ✅ Can administer ALL organizations and users"
    echo "   ✅ Has platform-wide access with '*' permissions"
    echo "   ✅ Can view and manage everything across the platform"
    echo "   ✅ Has super_admin role with global administrative rights"
    echo
    
    if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
        echo -e "${GREEN}🎉 All test users created successfully!${NC}"
        
        # Cleanup
        rm -f /tmp/register_user.json /tmp/login_test.json
        
        return 0
    else
        echo -e "${YELLOW}⚠️  Some users had issues, but core functionality should work${NC}"
        return 1
    fi
}

# Run the script
main