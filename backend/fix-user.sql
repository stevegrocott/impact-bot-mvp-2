-- Fix demo user organization membership

-- First, check if organization exists and create if needed
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
    is_active = true,
    updated_at = NOW();

-- Create user role if it doesn't exist
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    'user',
    'Standard user access',
    '["measurement:read", "measurement:create", "report:read", "conversation:*"]',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    permissions = '["measurement:read", "measurement:create", "report:read", "conversation:*"]',
    updated_at = NOW();

-- Ensure demo user exists and is active
INSERT INTO users (id, email, password_hash, first_name, last_name, job_title, is_active, is_email_verified, email_verified_at, created_at, updated_at, last_login_at)
VALUES (
    '5f0bf59a-68fe-4c37-a29d-cb4f1a800249',
    'demo@impact-bot.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp6V8E1N.',  -- demo123
    'Demo',
    'User',
    'Impact Measurement Specialist',
    true,
    true,
    NOW(),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    is_email_verified = true,
    email_verified_at = NOW(),
    updated_at = NOW();

-- Link user to organization
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, joined_at)
VALUES (
    'f1e2d3c4-b5a6-4c5b-9d8e-2f3a4b5c6d7e',
    '5f0bf59a-68fe-4c37-a29d-cb4f1a800249',
    '52b5c0e2-694a-459c-aec6-5e30c112122d',
    'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    true,
    NOW()
) ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role_id = 'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    is_primary = true;

-- Verify the setup
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.is_active as user_active,
    o.name as organization_name,
    o.is_active as org_active,
    r.name as role_name,
    uo.is_primary
FROM users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
JOIN roles r ON uo.role_id = r.id
WHERE u.email = 'demo@impact-bot.com';