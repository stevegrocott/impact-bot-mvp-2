-- Create a simple test user with organization

-- Create organization first
INSERT INTO organizations (id, name, description, industry, is_active, settings, created_at, updated_at) 
VALUES (
    gen_random_uuid(),
    'Test Organization',
    'Test organization for chat functionality',
    'non-profit',
    true,
    '{}',
    NOW(),
    NOW()
);

-- Create basic user role
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'test_user',
    'Test user role with chat permissions',
    '["conversation:*", "measurement:read"]',
    NOW(),
    NOW()
);

-- Create test user with simple credentials: test@test.com / test123
-- Password hash for 'test123' with bcrypt
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, is_email_verified, email_verified_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'test@test.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- 'test123'
    'Test',
    'User',
    true,
    true,
    NOW(),
    NOW(),
    NOW()
);

-- Link user to organization
INSERT INTO user_organizations (id, user_id, organization_id, role_id, is_primary, joined_at)
SELECT 
    gen_random_uuid(),
    u.id,
    o.id,
    r.id,
    true,
    NOW()
FROM users u, organizations o, roles r
WHERE u.email = 'test@test.com' 
  AND o.name = 'Test Organization'
  AND r.name = 'test_user';