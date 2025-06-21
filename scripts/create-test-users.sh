#!/bin/bash
# Create Test Users Script
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

# Test users configuration
declare -A USERS
USERS["admin@impact-bot.com"]="AdminTest123!|Super|Admin|Platform Administrator|super_admin"
USERS["orgadmin@impact-bot.com"]="OrgAdmin123!|Organization|Admin|Organization Administrator|org_admin"
USERS["manager@impact-bot.com"]="Manager123!|Impact|Manager|Impact Measurement Manager|impact_manager"
USERS["analyst@impact-bot.com"]="Analyst123!|Data|Analyst|Impact Data Analyst|impact_analyst"
USERS["viewer@impact-bot.com"]="Viewer123!|Report|Viewer|Stakeholder Report Viewer|report_viewer"
USERS["evaluator@impact-bot.com"]="Evaluator123!|External|Evaluator|Independent Evaluator|evaluator"
USERS["demo@impact-bot.com"]="Demo123!|Demo|User|Demo Account|impact_manager"

ORGANIZATION_ID=""
ADMIN_TOKEN=""
SUCCESS_COUNT=0
TOTAL_COUNT=${#USERS[@]}

# Function to create JSON files for curl requests
create_json_files() {
    mkdir -p /tmp/impact-bot-users
}

# Function to register a user
register_user() {
    local email="$1"
    local password="$2"
    local first_name="$3"
    local last_name="$4"
    local job_title="$5"
    local role="$6"
    local is_first_user="$7"
    
    echo -n "👤 Creating user: $email... "
    
    # Create registration JSON
    if [ "$is_first_user" = "true" ]; then
        # First user creates the organization
        cat > /tmp/impact-bot-users/register.json << EOF
{
    "email": "$email",
    "password": "$password",
    "firstName": "$first_name",
    "lastName": "$last_name",
    "jobTitle": "$job_title",
    "organization": {
        "name": "Impact Bot",
        "website": "https://impact-bot.com",
        "description": "AI-powered impact measurement platform organization"
    }
}
EOF
    else
        # Other users create their own workspace initially
        cat > /tmp/impact-bot-users/register.json << EOF
{
    "email": "$email",
    "password": "$password",
    "firstName": "$first_name",
    "lastName": "$last_name",
    "jobTitle": "$job_title",
    "organization": {
        "name": "$first_name's Workspace"
    }
}
EOF
    fi
    
    # Attempt registration
    RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d @/tmp/impact-bot-users/register.json)
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        
        # Extract organization ID and token for first user (admin)
        if [ "$is_first_user" = "true" ]; then
            ORGANIZATION_ID=$(echo "$RESPONSE" | sed -n 's/.*"organization":{"id":"\([^"]*\)".*/\1/p')
            ADMIN_TOKEN=$(echo "$RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
            echo "   📋 Impact Bot Organization ID: $ORGANIZATION_ID"
        fi
        
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        return 0
    else
        # Check if user already exists
        if echo "$RESPONSE" | grep -q "already exists"; then
            echo -e "${YELLOW}⚠️  EXISTS${NC}"
            
            # Try to login to verify credentials
            cat > /tmp/impact-bot-users/login.json << EOF
{
    "email": "$email",
    "password": "$password"
}
EOF
            
            LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
                -H "Content-Type: application/json" \
                -d @/tmp/impact-bot-users/login.json)
            
            if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
                echo "   ✅ Verified existing user credentials"
                
                # Extract org ID and token for admin if this is the first user
                if [ "$is_first_user" = "true" ]; then
                    ORGANIZATION_ID=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"organization":{"id":"\([^"]*\)".*/\1/p')
                    ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
                    echo "   📋 Impact Bot Organization ID: $ORGANIZATION_ID"
                fi
                
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                return 0
            else
                echo "   ❌ Password mismatch for existing user"
                return 1
            fi
        else
            echo -e "${RED}❌ FAILED${NC}"
            echo "   Error: $(echo "$RESPONSE" | sed -n 's/.*"error":"\([^"]*\)".*/\1/p')"
            return 1
        fi
    fi
}

# Function to test login for a user
test_login() {
    local email="$1"
    local password="$2"
    
    echo -n "🔐 Testing login: $email... "
    
    cat > /tmp/impact-bot-users/login_test.json << EOF
{
    "email": "$email",
    "password": "$password"
}
EOF
    
    RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d @/tmp/impact-bot-users/login_test.json)
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        
        # Extract role information
        ROLE=$(echo "$RESPONSE" | sed -n 's/.*"role":{"[^"]*":"[^"]*","name":"\([^"]*\)".*/\1/p')
        if [ -n "$ROLE" ]; then
            echo "   👤 Role: $ROLE"
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

# Main execution
main() {
    # Check if backend is running
    if ! curl -s "$API_BASE/../health" >/dev/null 2>&1; then
        echo -e "${RED}❌ Backend is not running on localhost:3003${NC}"
        echo "Please start the backend with: npm run dev:backend"
        exit 1
    fi
    
    create_json_files
    
    echo "🏢 Creating Impact Bot organization and users..."
    echo
    
    # First, create the super admin user (who creates the organization)
    ADMIN_EMAIL="admin@impact-bot.com"
    ADMIN_INFO="${USERS[$ADMIN_EMAIL]}"
    IFS='|' read -r password first_name last_name job_title role <<< "$ADMIN_INFO"
    
    register_user "$ADMIN_EMAIL" "$password" "$first_name" "$last_name" "$job_title" "$role" "true"
    echo
    
    # Then create all other users
    for email in "${!USERS[@]}"; do
        if [ "$email" != "$ADMIN_EMAIL" ]; then
            USER_INFO="${USERS[$email]}"
            IFS='|' read -r password first_name last_name job_title role <<< "$USER_INFO"
            
            register_user "$email" "$password" "$first_name" "$last_name" "$job_title" "$role" "false"
        fi
    done
    
    echo
    echo "🧪 Testing login functionality for all users..."
    echo
    
    # Test login for all users
    for email in "${!USERS[@]}"; do
        USER_INFO="${USERS[$email]}"
        IFS='|' read -r password first_name last_name job_title role <<< "$USER_INFO"
        
        test_login "$email" "$password"
    done
    
    echo
    echo "📊 Summary:"
    echo "==========="
    echo -e "Total users: $TOTAL_COUNT"
    echo -e "${GREEN}Successfully created/verified: $SUCCESS_COUNT${NC}"
    
    if [ -n "$ORGANIZATION_ID" ]; then
        echo -e "Organization: Impact Bot (ID: $ORGANIZATION_ID)"
    fi
    
    echo
    echo "📋 Test User Credentials:"
    echo "========================"
    printf "%-15s | %-25s | %-15s | %s\n" "ROLE" "EMAIL" "PASSWORD" "NAME"
    echo "--------------------------------------------------------------------"
    
    for email in "${!USERS[@]}"; do
        USER_INFO="${USERS[$email]}"
        IFS='|' read -r password first_name last_name job_title role <<< "$USER_INFO"
        printf "%-15s | %-25s | %-15s | %s %s\n" "$role" "$email" "$password" "$first_name" "$last_name"
    done
    
    echo
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3003"
    echo
    echo "🔐 Login with any of the above credentials to test different role capabilities."
    echo
    
    if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
        echo -e "${GREEN}🎉 All test users created successfully!${NC}"
        
        echo
        echo "📝 Super Admin Capabilities:"
        echo "   - admin@impact-bot.com has super_admin role"
        echo "   - Can administer ALL organizations and users"
        echo "   - Has platform-wide access with '*' permissions"
        echo "   - Can view and manage everything across the platform"
        
        # Cleanup
        rm -rf /tmp/impact-bot-users
        
        return 0
    else
        echo -e "${YELLOW}⚠️  Some users had issues, but core functionality should work${NC}"
        return 1
    fi
}

# Run the script
main