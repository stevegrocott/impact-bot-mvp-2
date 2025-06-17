-- Production Database Schema for Impact Bot IRIS+ Platform
-- Optimized for scale, LLM training, and modular development

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- REFERENCE DATA LAYER - IRIS+ Framework (Read-Only)
-- ============================================================================

-- Core IRIS+ Taxonomy Hierarchy
CREATE TABLE iris_impact_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iris_impact_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES iris_impact_categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iris_strategic_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    definition TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iris_key_dimensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    purpose TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iris_core_metric_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    purpose TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iris_key_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    calculation_guidance TEXT,
    why_important TEXT,
    data_collection_frequency VARCHAR(100),
    complexity_level VARCHAR(50) DEFAULT 'intermediate',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iris_data_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    iris_code VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition TEXT,
    calculation TEXT,
    usage_guidance TEXT,
    data_type VARCHAR(100),
    unit_of_measurement VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SDG Reference Data
CREATE TABLE sustainable_development_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    sdg_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sdg_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    target_code VARCHAR(20) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sdg_id UUID NOT NULL REFERENCES sustainable_development_goals(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sdg_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    indicator_code VARCHAR(50) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    target_id UUID NOT NULL REFERENCES sdg_targets(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metadata tables for field types and options
CREATE TABLE metric_field_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    validation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE metric_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    value_type VARCHAR(100),
    allowed_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- JUNCTION TABLES - Many-to-Many Relationships
-- ============================================================================

-- Theme to Goal relationships (141 unique pairs)
CREATE TABLE iris_theme_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID NOT NULL REFERENCES iris_impact_themes(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES iris_strategic_goals(id) ON DELETE CASCADE,
    relationship_strength INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(theme_id, goal_id)
);

-- Goal to SDG relationships (135 unique pairs)
CREATE TABLE iris_goal_sdgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES iris_strategic_goals(id) ON DELETE CASCADE,
    sdg_id UUID NOT NULL REFERENCES sustainable_development_goals(id) ON DELETE CASCADE,
    alignment_strength INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(goal_id, sdg_id)
);

-- Goal to Key Dimension relationships (354 unique pairs)
CREATE TABLE iris_goal_key_dimensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES iris_strategic_goals(id) ON DELETE CASCADE,
    key_dimension_id UUID NOT NULL REFERENCES iris_key_dimensions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(goal_id, key_dimension_id)
);

-- Key Dimension to Core Metric Set relationships (636 unique pairs)
CREATE TABLE iris_key_dimension_core_metric_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_dimension_id UUID NOT NULL REFERENCES iris_key_dimensions(id) ON DELETE CASCADE,
    core_metric_set_id UUID NOT NULL REFERENCES iris_core_metric_sets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key_dimension_id, core_metric_set_id)
);

-- Core Metric Set to Indicator relationships (1,755 unique pairs)
CREATE TABLE iris_core_metric_set_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    core_metric_set_id UUID NOT NULL REFERENCES iris_core_metric_sets(id) ON DELETE CASCADE,
    indicator_id UUID NOT NULL REFERENCES iris_key_indicators(id) ON DELETE CASCADE,
    priority_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(core_metric_set_id, indicator_id)
);

-- Indicator to Data Requirement relationships (3,125 unique pairs)
CREATE TABLE iris_indicator_data_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id UUID NOT NULL REFERENCES iris_key_indicators(id) ON DELETE CASCADE,
    data_requirement_id UUID NOT NULL REFERENCES iris_data_requirements(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    calculation_weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(indicator_id, data_requirement_id)
);

-- Data Requirements to Field Types and Options
CREATE TABLE iris_data_requirement_field_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_requirement_id UUID NOT NULL REFERENCES iris_data_requirements(id) ON DELETE CASCADE,
    field_type_id UUID NOT NULL REFERENCES metric_field_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data_requirement_id, field_type_id)
);

CREATE TABLE iris_data_requirement_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_requirement_id UUID NOT NULL REFERENCES iris_data_requirements(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES metric_options(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data_requirement_id, option_id)
);

-- ============================================================================
-- USER/ORGANIZATION LAYER - Multi-tenant User Data
-- ============================================================================

-- Organizations and Users
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size_category VARCHAR(50),
    country VARCHAR(100),
    website VARCHAR(255),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    job_title VARCHAR(255),
    phone VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-based access control
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- User-generated custom indicators
CREATE TABLE user_custom_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    calculation_method TEXT,
    data_collection_guidance TEXT,
    frequency VARCHAR(100),
    approval_status VARCHAR(50) DEFAULT 'draft',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    tags JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User measurements and data collection
CREATE TABLE user_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    indicator_id UUID REFERENCES iris_key_indicators(id),
    custom_indicator_id UUID REFERENCES user_custom_indicators(id),
    measurement_period_start DATE NOT NULL,
    measurement_period_end DATE NOT NULL,
    value DECIMAL(15,4),
    unit VARCHAR(100),
    methodology TEXT,
    data_quality_score INTEGER CHECK (data_quality_score >= 1 AND data_quality_score <= 5),
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'draft',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (indicator_id IS NOT NULL AND custom_indicator_id IS NULL) OR
        (indicator_id IS NULL AND custom_indicator_id IS NOT NULL)
    )
);

-- User reports
CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) NOT NULL,
    period_start DATE,
    period_end DATE,
    content JSONB DEFAULT '{}',
    template_id UUID,
    status VARCHAR(50) DEFAULT 'draft',
    shared_with JSONB DEFAULT '[]',
    export_formats JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATION LAYER - LLM Interaction and Training
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500),
    conversation_type VARCHAR(100) DEFAULT 'discovery',
    context_data JSONB DEFAULT '{}',
    current_step VARCHAR(100),
    completion_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES conversation_messages(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(100) NOT NULL,
    recommended_item_id UUID,
    recommended_item_type VARCHAR(100),
    confidence_score DECIMAL(5,4),
    reasoning TEXT,
    user_feedback VARCHAR(50), -- 'accepted', 'rejected', 'modified'
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query pattern analysis for LLM optimization
CREATE TABLE query_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    query_vector JSONB, -- For future vector similarity search
    intent_classification VARCHAR(100),
    entities_extracted JSONB DEFAULT '[]',
    successful_results_count INTEGER DEFAULT 0,
    total_usage_count INTEGER DEFAULT 1,
    avg_user_satisfaction DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM LAYER - Infrastructure and Monitoring
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE data_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100) NOT NULL, -- 'airtable_full', 'airtable_delta', etc.
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION - Indexes
-- ============================================================================

-- Core relationship traversal indexes
CREATE INDEX idx_themes_category ON iris_impact_themes(category_id);
CREATE INDEX idx_theme_goals_theme ON iris_theme_goals(theme_id);
CREATE INDEX idx_theme_goals_goal ON iris_theme_goals(goal_id);
CREATE INDEX idx_goal_sdgs_goal ON iris_goal_sdgs(goal_id);
CREATE INDEX idx_goal_sdgs_sdg ON iris_goal_sdgs(sdg_id);
CREATE INDEX idx_goal_dimensions_goal ON iris_goal_key_dimensions(goal_id);
CREATE INDEX idx_dimension_metrics_dimension ON iris_key_dimension_core_metric_sets(key_dimension_id);
CREATE INDEX idx_metric_indicators_metric ON iris_core_metric_set_indicators(core_metric_set_id);
CREATE INDEX idx_indicator_data_indicator ON iris_indicator_data_requirements(indicator_id);

-- Full-text search indexes
CREATE INDEX idx_goals_search ON iris_strategic_goals USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_indicators_search ON iris_key_indicators USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_data_reqs_search ON iris_data_requirements USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- User data isolation and performance
CREATE INDEX idx_measurements_org_date ON user_measurements(organization_id, measurement_period_start);
CREATE INDEX idx_conversations_user_active ON conversations(user_id, is_active, updated_at);
CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id, created_at);

-- Audit and monitoring
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_org_time ON audit_logs(organization_id, created_at);

-- Airtable ID lookups for sync
CREATE INDEX idx_categories_airtable ON iris_impact_categories(airtable_id);
CREATE INDEX idx_themes_airtable ON iris_impact_themes(airtable_id);
CREATE INDEX idx_goals_airtable ON iris_strategic_goals(airtable_id);
CREATE INDEX idx_indicators_airtable ON iris_key_indicators(airtable_id);
CREATE INDEX idx_data_reqs_airtable ON iris_data_requirements(airtable_id);

-- ============================================================================
-- MATERIALIZED VIEWS - Pre-computed for LLM Context
-- ============================================================================

-- Category to data requirements chain for fast LLM context retrieval
CREATE MATERIALIZED VIEW mv_category_to_data_requirements AS
SELECT DISTINCT 
    c.id as category_id,
    c.name as category_name,
    dr.id as data_requirement_id,
    dr.name as data_requirement_name,
    dr.description as data_requirement_description,
    dr.calculation as calculation_guidance,
    array_agg(DISTINCT t.name ORDER BY t.name) as theme_names,
    array_agg(DISTINCT g.name ORDER BY g.name) as goal_names,
    array_agg(DISTINCT i.name ORDER BY i.name) as indicator_names,
    count(DISTINCT tg.goal_id) as related_goals_count,
    count(DISTINCT cmsi.indicator_id) as related_indicators_count
FROM iris_impact_categories c
JOIN iris_impact_themes t ON t.category_id = c.id
JOIN iris_theme_goals tg ON tg.theme_id = t.id  
JOIN iris_strategic_goals g ON g.id = tg.goal_id
JOIN iris_goal_key_dimensions gkd ON gkd.goal_id = g.id
JOIN iris_key_dimension_core_metric_sets kdcms ON kdcms.key_dimension_id = gkd.key_dimension_id
JOIN iris_core_metric_set_indicators cmsi ON cmsi.core_metric_set_id = kdcms.core_metric_set_id
JOIN iris_key_indicators i ON i.id = cmsi.indicator_id
JOIN iris_indicator_data_requirements idr ON idr.indicator_id = i.id
JOIN iris_data_requirements dr ON dr.id = idr.data_requirement_id
GROUP BY c.id, c.name, dr.id, dr.name, dr.description, dr.calculation;

-- SDG to indicators view for impact alignment
CREATE MATERIALIZED VIEW mv_sdg_to_indicators AS
SELECT DISTINCT
    s.id as sdg_id,
    s.sdg_number,
    s.name as sdg_name,
    i.id as indicator_id,
    i.name as indicator_name,
    i.calculation_guidance,
    dr.id as data_requirement_id,
    dr.name as data_requirement_name,
    count(*) OVER (PARTITION BY s.id, i.id) as relationship_strength
FROM sustainable_development_goals s
JOIN iris_goal_sdgs gs ON gs.sdg_id = s.id
JOIN iris_strategic_goals g ON g.id = gs.goal_id
JOIN iris_goal_key_dimensions gkd ON gkd.goal_id = g.id
JOIN iris_key_dimension_core_metric_sets kdcms ON kdcms.key_dimension_id = gkd.key_dimension_id
JOIN iris_core_metric_set_indicators cmsi ON cmsi.core_metric_set_id = kdcms.core_metric_set_id
JOIN iris_key_indicators i ON i.id = cmsi.indicator_id
JOIN iris_indicator_data_requirements idr ON idr.indicator_id = i.id
JOIN iris_data_requirements dr ON dr.id = idr.data_requirement_id;

-- Theme overlap analysis for cross-cutting insights
CREATE MATERIALIZED VIEW mv_theme_relationships AS
SELECT 
    t1.id as theme1_id,
    t1.name as theme1_name,
    t2.id as theme2_id,
    t2.name as theme2_name,
    count(DISTINCT tg1.goal_id) as shared_goals_count,
    array_agg(DISTINCT g.name ORDER BY g.name) as shared_goal_names
FROM iris_theme_goals tg1
JOIN iris_theme_goals tg2 ON tg1.goal_id = tg2.goal_id AND tg1.theme_id < tg2.theme_id
JOIN iris_impact_themes t1 ON t1.id = tg1.theme_id
JOIN iris_impact_themes t2 ON t2.id = tg2.theme_id
JOIN iris_strategic_goals g ON g.id = tg1.goal_id
GROUP BY t1.id, t1.name, t2.id, t2.name
HAVING count(DISTINCT tg1.goal_id) > 0;

-- Create indexes on materialized views
CREATE INDEX idx_mv_category_data_category ON mv_category_to_data_requirements(category_id);
CREATE INDEX idx_mv_category_data_name ON mv_category_to_data_requirements(category_name);
CREATE INDEX idx_mv_sdg_indicators_sdg ON mv_sdg_to_indicators(sdg_id);
CREATE INDEX idx_mv_theme_rel_theme1 ON mv_theme_relationships(theme1_id);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers to all tables with updated_at
CREATE TRIGGER update_iris_impact_categories_updated_at BEFORE UPDATE ON iris_impact_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iris_impact_themes_updated_at BEFORE UPDATE ON iris_impact_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iris_strategic_goals_updated_at BEFORE UPDATE ON iris_strategic_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iris_key_dimensions_updated_at BEFORE UPDATE ON iris_key_dimensions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iris_core_metric_sets_updated_at BEFORE UPDATE ON iris_core_metric_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iris_key_indicators_updated_at BEFORE UPDATE ON iris_key_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iris_data_requirements_updated_at BEFORE UPDATE ON iris_data_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_to_data_requirements;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sdg_to_indicators;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_theme_relationships;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Full system administration access', '["*"]'),
('org_admin', 'Organization administration', '["org:*", "user:read", "measurement:*", "report:*"]'),
('user', 'Standard user access', '["measurement:read", "measurement:create", "report:read", "conversation:*"]'),
('viewer', 'Read-only access', '["measurement:read", "report:read", "conversation:read"]');

-- Add comments for documentation
COMMENT ON TABLE iris_impact_categories IS 'IRIS+ Impact Categories - 17 core impact areas aligned with ISIC classifications';
COMMENT ON TABLE iris_impact_themes IS 'IRIS+ Impact Themes - 28 thematic approaches within categories';
COMMENT ON TABLE iris_strategic_goals IS 'IRIS+ Strategic Goals - 72 common impact strategies';
COMMENT ON TABLE iris_key_indicators IS 'IRIS+ Key Indicators - 731 performance indicators';
COMMENT ON TABLE iris_data_requirements IS 'IRIS+ Data Requirements - 787 specific data needs for calculations';

COMMENT ON TABLE iris_theme_goals IS 'Junction table: Theme to Goal relationships (141 unique pairs)';
COMMENT ON TABLE iris_goal_sdgs IS 'Junction table: Goal to SDG relationships (135 unique pairs)';
COMMENT ON TABLE iris_indicator_data_requirements IS 'Junction table: Indicator to Data Requirements (3,125 unique pairs)';

COMMENT ON MATERIALIZED VIEW mv_category_to_data_requirements IS 'Pre-computed view for LLM context: Category to Data Requirements chain';
COMMENT ON MATERIALIZED VIEW mv_sdg_to_indicators IS 'Pre-computed view for LLM context: SDG to Indicators mapping';

-- Schema is ready for production deployment