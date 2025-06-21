#!/bin/bash

echo "Testing all user logins..."
echo ""

# Test each user
declare -a users=(
    "admin@impact-bot.com:AdminTest123!"
    "orgadmin@demo.org:OrgAdmin123!" 
    "manager@demo.org:Manager123!"
    "analyst@demo.org:Analyst123!"
    "viewer@demo.org:Viewer123!"
    "evaluator@external.com:Evaluator123!"
)

for user_creds in "${users[@]}"; do
    email=$(echo "$user_creds" | cut -d: -f1)
    password=$(echo "$user_creds" | cut -d: -f2)
    
    echo "Testing: $email"
    
    response=$(curl -s -X POST http://localhost:3003/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        echo "✅ SUCCESS"
        org_name=$(echo "$response" | jq -r '.data.organization.name // "Unknown"')
        role_name=$(echo "$response" | jq -r '.data.organization.role.name // "Unknown"')
        echo "   Organization: $org_name"
        echo "   Role: $role_name"
    else
        error=$(echo "$response" | jq -r '.error // "Unknown error"')
        echo "❌ FAILED: $error"
    fi
    echo ""
done

echo "User login testing complete."