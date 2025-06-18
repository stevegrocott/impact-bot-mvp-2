#!/bin/bash

# Rich Test Data Creation for Impact Bot
# Creates comprehensive testing scenarios with different users, organizations, and states

set -e

echo "🎭 Creating rich test data for Impact Bot testing..."

# Color codes
GREEN='\033[0;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DB_NAME="impactbot_v2_dev"
PSQL_CMD="docker exec impactbot-v2-database psql -U postgres -d $DB_NAME"

create_step() {
    local step_name="$1"
    local sql_commands="$2"
    
    echo -e "${YELLOW}Creating: $step_name${NC}"
    echo "$sql_commands" | $PSQL_CMD
    echo -e "${GREEN}✅ $step_name created${NC}"
}

# Step 1: Create Test Organizations at Different States
create_step "Test Organizations" "
-- GreenFuture Foundation (Just starting impact measurement)
INSERT INTO organizations (id, name, description, industry, is_active, settings, created_at, updated_at) 
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'GreenFuture Foundation',
    'Environmental conservation foundation just beginning their impact measurement journey',
    'environmental',
    true,
    '{\"measurement_stage\": \"discovery\", \"framework_preference\": \"undecided\"}',
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month'
) ON CONFLICT (id) DO NOTHING;

-- Urban Youth Alliance (Framework selected, picking indicators)
INSERT INTO organizations (id, name, description, industry, is_active, settings, created_at, updated_at) 
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Urban Youth Alliance',
    'Youth development organization that has selected IRIS+ and is now choosing indicators',
    'education',
    true,
    '{\"measurement_stage\": \"indicator_selection\", \"framework_selected\": \"iris_plus\", \"focus_areas\": [\"education\", \"employment\"]}',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '1 week'
) ON CONFLICT (id) DO NOTHING;

-- Clean Water Project (Active measurement, collecting data)
INSERT INTO organizations (id, name, description, industry, is_active, settings, created_at, updated_at) 
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Clean Water Project',
    'Water access nonprofit actively collecting impact data using IRIS+ framework',
    'health',
    true,
    '{\"measurement_stage\": \"data_collection\", \"framework_selected\": \"iris_plus\", \"active_indicators\": 12, \"measurement_frequency\": \"monthly\"}',
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Education Access Network (Full reporting, multiple cycles)
INSERT INTO organizations (id, name, description, industry, is_active, settings, created_at, updated_at) 
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Education Access Network',
    'Mature education nonprofit with multiple measurement cycles and comprehensive reporting',
    'education',
    true,
    '{\"measurement_stage\": \"reporting\", \"framework_selected\": \"iris_plus\", \"measurement_cycles\": 8, \"reports_generated\": 4}',
    NOW() - INTERVAL '2 years',
    NOW() - INTERVAL '2 hours'
) ON CONFLICT (id) DO NOTHING;
"

# Step 2: Create User Roles
create_step "User Roles" "
-- Standard User Role
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES (
    'role-user-standard',
    'Standard User',
    'Standard user with measurement and reporting capabilities',
    '[\"measurement:read\", \"measurement:create\", \"report:read\", \"conversation:create\", \"indicators:select\"]',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Program Officer Role  
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES (
    'role-program-officer',
    'Program Officer',
    'Foundation program officer with oversight and review capabilities',
    '[\"measurement:read\", \"measurement:review\", \"report:read\", \"report:create\", \"conversation:create\", \"organization:view\"]',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Measurement Specialist Role
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES (
    'role-measurement-specialist',
    'Measurement Specialist',
    'Expert user with advanced measurement and framework capabilities',
    '[\"measurement:*\", \"report:*\", \"conversation:*\", \"indicators:*\", \"framework:configure\"]',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Board Member Role
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES (
    'role-board-member',
    'Board Member',
    'Board member with read-only access to reports and high-level metrics',
    '[\"report:read\", \"measurement:read\", \"conversation:view\"]',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;
"

# Step 3: Create Test Users with Different Personas
create_step "Test User Personas" "
-- Sarah Chen - Foundation Program Officer (experienced)
INSERT INTO users (id, email, password_hash, first_name, last_name, job_title, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
VALUES (
    'user-sarah-chen',
    'sarah.chen@greenfuture.org',
    '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp6V8E1N.',  -- demo123
    'Sarah',
    'Chen',
    'Senior Program Officer',
    true,
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '2 hours'
) ON CONFLICT (email) DO NOTHING;

-- Marcus Rodriguez - Nonprofit Director (beginner)  
INSERT INTO users (id, email, password_hash, first_name, last_name, job_title, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
VALUES (
    'user-marcus-rodriguez',
    'marcus@urbanyouth.org',
    '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp6V8E1N.',  -- demo123
    'Marcus',
    'Rodriguez',
    'Executive Director',
    true,
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (email) DO NOTHING;

-- Dr. Aisha Patel - Measurement Specialist (expert)
INSERT INTO users (id, email, password_hash, first_name, last_name, job_title, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
VALUES (
    'user-aisha-patel',
    'aisha.patel@cleanwater.org',
    '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp6V8E1N.',  -- demo123
    'Aisha',
    'Patel',
    'Impact Measurement Director',
    true,
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '30 minutes'
) ON CONFLICT (email) DO NOTHING;

-- Robert Kim - Board Member (oversight focused)
INSERT INTO users (id, email, password_hash, first_name, last_name, job_title, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
VALUES (
    'user-robert-kim',
    'robert.kim@educationaccess.org',
    '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp6V8E1N.',  -- demo123
    'Robert',
    'Kim',
    'Board Chair',
    true,
    NOW() - INTERVAL '2 years',
    NOW() - INTERVAL '2 years',
    NOW() - INTERVAL '2 years',
    NOW() - INTERVAL '1 week'
) ON CONFLICT (email) DO NOTHING;

-- Demo User (for quick testing)
INSERT INTO users (id, email, password_hash, first_name, last_name, job_title, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
VALUES (
    'user-demo-user',
    'demo@impact-bot.com',
    '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp6V8E1N.',  -- demo123
    'Demo',
    'User',
    'Impact Measurement Specialist',
    true,
    NOW(),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
"

# Step 4: Link Users to Organizations with Appropriate Roles
create_step "User-Organization Relationships" "
-- Sarah Chen -> GreenFuture Foundation (Program Officer)
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, created_at, updated_at)
VALUES (
    'uo-sarah-greenfuture',
    'user-sarah-chen',
    '11111111-1111-1111-1111-111111111111',
    'role-program-officer',
    true,
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month'
) ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Marcus Rodriguez -> Urban Youth Alliance (Standard User)
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, created_at, updated_at)
VALUES (
    'uo-marcus-urbanyouth',
    'user-marcus-rodriguez',
    '22222222-2222-2222-2222-222222222222',
    'role-user-standard',
    true,
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks'
) ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Dr. Aisha Patel -> Clean Water Project (Measurement Specialist)
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, created_at, updated_at)
VALUES (
    'uo-aisha-cleanwater',
    'user-aisha-patel',
    '33333333-3333-3333-3333-333333333333',
    'role-measurement-specialist',
    true,
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '6 months'
) ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Robert Kim -> Education Access Network (Board Member)
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, created_at, updated_at)
VALUES (
    'uo-robert-education',
    'user-robert-kim',
    '44444444-4444-4444-4444-444444444444',
    'role-board-member',
    true,
    NOW() - INTERVAL '2 years',
    NOW() - INTERVAL '2 years'
) ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Demo User -> GreenFuture Foundation (Standard User - for quick testing)
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, created_at, updated_at)
VALUES (
    'uo-demo-greenfuture',
    'user-demo-user',
    '11111111-1111-1111-1111-111111111111',
    'role-user-standard',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id, organization_id) DO NOTHING;
"

# Step 5: Create Conversations at Different States
create_step "Conversation Scenarios" "
-- Discovery conversation (Sarah at GreenFuture)
INSERT INTO conversations (id, user_id, organization_id, title, conversation_type, context_data, current_step, completion_percentage, created_at, updated_at)
VALUES (
    'conv-discovery-sarah',
    'user-sarah-chen',
    '11111111-1111-1111-1111-111111111111',
    'Getting Started with Impact Measurement',
    'discovery',
    '{\"stage\": \"impact_vision\", \"topics_covered\": [\"organizational_goals\", \"current_measurement\"], \"recommendations_given\": 3}',
    'impact_vision',
    15,
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '1 week'
) ON CONFLICT (id) DO NOTHING;

-- Framework selection conversation (Marcus at Urban Youth)
INSERT INTO conversations (id, user_id, organization_id, title, conversation_type, context_data, current_step, completion_percentage, created_at, updated_at)
VALUES (
    'conv-framework-marcus',
    'user-marcus-rodriguez',
    '22222222-2222-2222-2222-222222222222',
    'Choosing the Right Measurement Framework',
    'framework_selection',
    '{\"stage\": \"framework_comparison\", \"frameworks_considered\": [\"iris_plus\", \"theory_of_change\"], \"selected_framework\": \"iris_plus\"}',
    'framework_comparison',
    45,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Indicator selection conversation (Aisha at Clean Water)
INSERT INTO conversations (id, user_id, organization_id, title, conversation_type, context_data, current_step, completion_percentage, created_at, updated_at)
VALUES (
    'conv-indicators-aisha',
    'user-aisha-patel',
    '33333333-3333-3333-3333-333333333333',
    'Selecting Water Access Indicators',
    'indicator_selection',
    '{\"stage\": \"indicator_refinement\", \"focus_area\": \"water_sanitation\", \"indicators_selected\": 8, \"custom_indicators\": 2}',
    'indicator_refinement',
    75,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '6 hours'
) ON CONFLICT (id) DO NOTHING;

-- Reporting conversation (Robert at Education Access)
INSERT INTO conversations (id, user_id, organization_id, title, conversation_type, context_data, current_step, completion_percentage, created_at, updated_at)
VALUES (
    'conv-reporting-robert',
    'user-robert-kim',
    '44444444-4444-4444-4444-444444444444',
    'Quarterly Impact Report Review',
    'reporting',
    '{\"stage\": \"report_analysis\", \"reporting_period\": \"Q2_2024\", \"key_insights\": 5, \"stakeholder_focus\": \"board_presentation\"}',
    'report_analysis',
    90,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 hours'
) ON CONFLICT (id) DO NOTHING;

-- Demo conversation (for quick testing)
INSERT INTO conversations (id, user_id, organization_id, title, conversation_type, context_data, current_step, completion_percentage, created_at, updated_at)
VALUES (
    'conv-demo-welcome',
    'user-demo-user',
    '11111111-1111-1111-1111-111111111111',
    'Welcome to Impact Bot',
    'general_chat',
    '{\"initial_setup\": true, \"user_type\": \"first_time\"}',
    'welcome',
    0,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;
"

# Step 6: Add Sample Messages to Conversations
create_step "Conversation Messages" "
-- Discovery conversation messages
INSERT INTO conversation_messages (id, conversation_id, message_type, role, content, metadata, created_at)
VALUES 
    ('msg-discovery-1', 'conv-discovery-sarah', 'assistant', 'assistant', 'Welcome to Impact Bot! I''m here to help GreenFuture Foundation develop a comprehensive impact measurement strategy. To get started, could you tell me about your organization''s primary mission and goals?', '{\"message_type\": \"greeting\", \"conversation_stage\": \"discovery\"}', NOW() - INTERVAL '2 weeks'),
    ('msg-discovery-2', 'conv-discovery-sarah', 'user', 'user', 'We focus on environmental conservation, particularly forest restoration and biodiversity protection. We want to measure our impact but aren''t sure where to start.', '{\"user_input\": true, \"topics\": [\"environmental\", \"conservation\", \"measurement_novice\"]}', NOW() - INTERVAL '2 weeks'),
    ('msg-discovery-3', 'conv-discovery-sarah', 'assistant', 'assistant', 'Excellent! Environmental conservation impact can be measured across multiple dimensions. For forest restoration, we could look at direct outputs like trees planted, intermediate outcomes like forest cover increase, and long-term impacts like biodiversity indices and carbon sequestration. Would you like to explore the IRIS+ framework which has specific metrics for environmental impact?', '{\"recommendations\": [\"iris_plus\", \"environmental_metrics\"], \"next_steps\": [\"framework_introduction\"]}', NOW() - INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

-- Framework selection messages  
INSERT INTO conversation_messages (id, conversation_id, message_type, role, content, metadata, created_at)
VALUES
    ('msg-framework-1', 'conv-framework-marcus', 'assistant', 'assistant', 'I understand Urban Youth Alliance is ready to select a measurement framework. Based on your focus on education and employment outcomes for youth, I''d recommend comparing IRIS+ with a Theory of Change approach. IRIS+ provides standardized metrics that funders love, while Theory of Change helps map your specific pathway to impact. Which aspects of measurement are most important to your stakeholders?', '{\"frameworks_presented\": [\"iris_plus\", \"theory_of_change\"], \"decision_factors\": [\"funder_requirements\", \"stakeholder_communication\"]}', NOW() - INTERVAL '1 week'),
    ('msg-framework-2', 'conv-framework-marcus', 'user', 'user', 'Our funders definitely want standardized metrics they can compare across their portfolio. But we also need something that helps us understand if our programs are actually working as intended.', '{\"priorities\": [\"funder_alignment\", \"program_improvement\"], \"stakeholder_focus\": \"funders\"}', NOW() - INTERVAL '6 days'),
    ('msg-framework-3', 'conv-framework-marcus', 'assistant', 'assistant', 'Perfect! IRIS+ is ideal for funder reporting with its standardized metrics, and we can layer in Theory of Change thinking for your program improvement needs. Let''s start with IRIS+ as your primary framework and I''ll help you select indicators that both satisfy funders and provide actionable insights for your team.', '{\"framework_selected\": \"iris_plus\", \"next_phase\": \"indicator_selection\", \"hybrid_approach\": true}', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Demo welcome message
INSERT INTO conversation_messages (id, conversation_id, message_type, role, content, metadata, created_at)
VALUES 
    ('msg-demo-welcome', 'conv-demo-welcome', 'assistant', 'assistant', 'Welcome to Impact Bot! I''m here to help you measure your impact effectively. I can assist with selecting measurement frameworks, choosing indicators, analyzing data, and creating compelling impact stories. What would you like to explore first?', '{\"message_type\": \"welcome\", \"capabilities_highlighted\": [\"framework_selection\", \"indicator_choice\", \"data_analysis\", \"storytelling\"]}', NOW())
ON CONFLICT (id) DO NOTHING;
"

echo -e "${GREEN}🎉 Rich test data creation completed!${NC}"
echo ""
echo -e "${BLUE}📊 Test Data Summary:${NC}"
echo "👥 Users Created: 5 (including demo user)"
echo "🏢 Organizations: 4 (at different measurement stages)"  
echo "💬 Conversations: 5 (covering different user journeys)"
echo "📝 Messages: 8 (realistic conversation examples)"
echo ""
echo -e "${BLUE}🔐 Test Login Credentials (all use password: demo123):${NC}"
echo "• demo@impact-bot.com - Demo User (quick testing)"
echo "• sarah.chen@greenfuture.org - Foundation Program Officer"
echo "• marcus@urbanyouth.org - Nonprofit Director (beginner)"
echo "• aisha.patel@cleanwater.org - Measurement Specialist (expert)"
echo "• robert.kim@educationaccess.org - Board Member (oversight)"
echo ""
echo -e "${BLUE}🎯 Testing Scenarios Available:${NC}"
echo "• Discovery phase: New organization exploring impact measurement"
echo "• Framework selection: Choosing between measurement approaches"
echo "• Indicator selection: Detailed metric choosing process"
echo "• Data collection: Active measurement workflows"
echo "• Reporting: Analysis and stakeholder communication"
echo ""
echo -e "${GREEN}✅ Your dev environment now has comprehensive test data for Impact Bot validation!${NC}"