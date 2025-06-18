-- Test User Data for Development Environment
-- This data is automatically loaded in development mode

-- Insert test organization
INSERT INTO organizations (id, name, description, industry, is_active, settings, created_at, updated_at) 
VALUES (
    '52b5c0e2-694a-459c-aec6-5e30c112122d',
    'Demo Organization',
    'Sample organization for testing and development',
    'non-profit',
    true,
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert test role
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    'user',
    'Standard user access',
    '["measurement:read", "measurement:create", "report:read", "conversation:*"]',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Insert test user (password: demo123)
INSERT INTO users (id, email, password_hash, first_name, last_name, job_title, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
VALUES (
    '5f0bf59a-68fe-4c37-a29d-cb4f1a800249',
    'demo@impact-bot.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp6V8E1N.',  -- demo123
    'Demo',
    'User',
    'Impact Measurement Specialist',
    true,
    NOW(),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    job_title = EXCLUDED.job_title,
    updated_at = NOW();

-- Link user to organization
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, created_at, updated_at)
VALUES (
    'f1e2d3c4-b5a6-4c5b-9d8e-2f3a4b5c6d7e',
    '5f0bf59a-68fe-4c37-a29d-cb4f1a800249',
    '52b5c0e2-694a-459c-aec6-5e30c112122d',
    'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    is_primary = EXCLUDED.is_primary,
    updated_at = NOW();

-- Insert sample conversation for testing
INSERT INTO conversations (id, user_id, organization_id, title, conversation_type, context_data, current_step, completion_percentage, created_at, updated_at)
VALUES (
    'c1b2a3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    '5f0bf59a-68fe-4c37-a29d-cb4f1a800249',
    '52b5c0e2-694a-459c-aec6-5e30c112122d',
    'Welcome to Impact Bot',
    'general_chat',
    '{"initial_setup": true}',
    'welcome',
    0,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    updated_at = NOW();

-- Insert welcome message
INSERT INTO conversation_messages (id, conversation_id, message_type, content, metadata, created_at)
VALUES (
    'm1b2a3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    'c1b2a3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    'assistant',
    'Welcome to Impact Bot! I''m here to help you measure your impact effectively. How can I assist you today?',
    '{"message_type": "welcome", "auto_generated": true}',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata;