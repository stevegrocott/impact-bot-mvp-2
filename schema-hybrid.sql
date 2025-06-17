-- Enhanced Production Database Schema for Impact Bot IRIS+ Platform
-- Optimized for hybrid vector + structured content architecture

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for embedding support

-- ============================================================================
-- ENHANCED REFERENCE DATA LAYER - IRIS+ Framework with Vector Embeddings
-- ============================================================================

-- Core IRIS+ Taxonomy Hierarchy with Vector Support
CREATE TABLE iris_impact_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Vector embeddings for semantic search
    embedding vector(1536),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
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
    
    -- Vector embeddings
    embedding vector(1536),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
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
    
    -- Vector embeddings
    embedding vector(1536),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
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
    
    -- Vector embeddings
    embedding vector(1536),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
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
    
    -- Vector embeddings
    embedding vector(1536),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
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
    
    -- Vector embeddings
    embedding vector(1536),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
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
    
    -- Vector embeddings
    embedding vector(1536),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- HYBRID CONTENT SYSTEM - Structured Markdown + Vector Embeddings
-- ============================================================================

CREATE TABLE llm_content_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- VECTOR SEARCH CAPABILITIES
    embedding vector(1536) NOT NULL,
    query_keywords TEXT[] NOT NULL,
    semantic_tags TEXT[] NOT NULL DEFAULT '{}',
    
    -- STRUCTURED CONTENT QUALITY  
    content_markdown TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'goal_guidance', 'indicator_calculation', etc.
    context_level INTEGER NOT NULL CHECK (context_level BETWEEN 1 AND 3), -- 1=basic, 2=intermediate, 3=advanced
    completeness_score DECIMAL(3,2) DEFAULT 0.8 CHECK (completeness_score BETWEEN 0 AND 1),
    clarity_score DECIMAL(3,2) DEFAULT 0.8 CHECK (clarity_score BETWEEN 0 AND 1),
    actionability_score DECIMAL(3,2) DEFAULT 0.8 CHECK (actionability_score BETWEEN 0 AND 1),
    
    -- HYBRID METADATA
    source_entities JSONB NOT NULL DEFAULT '{}',
    cross_references UUID[] DEFAULT '{}',
    
    -- PERFORMANCE OPTIMIZATION
    access_frequency INTEGER DEFAULT 0,
    hit_rate DECIMAL(5,4) DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- STANDARD FIELDS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector similarity cache for faster retrieval
CREATE TABLE vector_similarity_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_embedding vector(1536) NOT NULL,
    similar_content_ids UUID[] NOT NULL,
    similarity_scores DECIMAL(5,4)[] NOT NULL,
    query_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context effectiveness tracking
CREATE TABLE context_effectiveness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_pattern TEXT NOT NULL,
    query_type VARCHAR(100) NOT NULL,
    success_rate DECIMAL(5,4) NOT NULL,
    avg_response_quality DECIMAL(3,2),
    usage_count INTEGER DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM training conversation pairs
CREATE TABLE llm_training_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID, -- References conversations(id)
    user_input TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    context_data JSONB NOT NULL,
    quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1),
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    improvement_notes TEXT,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED CONVERSATION LAYER with Vector Context
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    title VARCHAR(500),
    conversation_type VARCHAR(100) DEFAULT 'discovery',
    context_data JSONB DEFAULT '{}',
    context_embedding vector(1536), -- Embedding of conversation context
    current_step VARCHAR(100),
    completion_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    content_embedding vector(1536), -- Embedding of message content
    metadata JSONB DEFAULT '{}',
    relevance_score DECIMAL(5,4),
    explanation TEXT,
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
    user_feedback VARCHAR(50), -- 'helpful', 'not_helpful', 'irrelevant'
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced query patterns with vector analysis
CREATE TABLE query_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    query_vector vector(1536),
    intent_classification VARCHAR(100),
    entities_extracted JSONB DEFAULT '[]',
    successful_results_count INTEGER DEFAULT 0,
    total_usage_count INTEGER DEFAULT 1,
    avg_user_satisfaction DECIMAL(3,2),
    context_embedding vector(1536),
    improvement_suggestions JSONB DEFAULT '{}',
    learning_weight DECIMAL(5,4) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INTELLIGENT CACHING SYSTEM
-- ============================================================================

CREATE TABLE intelligent_context_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    context_data JSONB NOT NULL,
    relevance_tags TEXT[] NOT NULL,
    context_embedding vector(1536),
    access_count INTEGER DEFAULT 0,
    hit_rate DECIMAL(5,4) DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query optimization recommendations
CREATE TABLE query_optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_pattern_id UUID REFERENCES query_patterns(id),
    optimization_type VARCHAR(100) NOT NULL,
    recommendation TEXT NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    implementation_priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    implemented_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- HYBRID SEARCH INDEXES
-- ============================================================================

-- Vector similarity indexes
CREATE INDEX idx_categories_embedding ON iris_impact_categories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_themes_embedding ON iris_impact_themes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_goals_embedding ON iris_strategic_goals USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_indicators_embedding ON iris_key_indicators USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_data_req_embedding ON iris_data_requirements USING ivfflat (embedding vector_cosine_ops);

-- LLM content chunks indexes
CREATE INDEX idx_chunks_vector ON llm_content_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chunks_semantic ON llm_content_chunks USING gin(semantic_tags);
CREATE INDEX idx_chunks_keywords ON llm_content_chunks USING gin(query_keywords);
CREATE INDEX idx_chunks_performance ON llm_content_chunks(access_frequency DESC, completeness_score DESC);
CREATE INDEX idx_chunks_type_level ON llm_content_chunks(content_type, context_level);

-- Conversation indexes
CREATE INDEX idx_conversations_embedding ON conversations USING ivfflat (context_embedding vector_cosine_ops);
CREATE INDEX idx_messages_embedding ON conversation_messages USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX idx_conversations_user_org ON conversations(user_id, organization_id, updated_at DESC);

-- Cache indexes
CREATE INDEX idx_vector_cache_hash ON vector_similarity_cache(query_hash);
CREATE INDEX idx_vector_cache_expires ON vector_similarity_cache(expires_at);
CREATE INDEX idx_context_cache_performance ON intelligent_context_cache(hit_rate DESC, access_count DESC, last_accessed DESC);
CREATE INDEX idx_context_cache_tags ON intelligent_context_cache USING gin(relevance_tags);
CREATE INDEX idx_context_cache_embedding ON intelligent_context_cache USING ivfflat (context_embedding vector_cosine_ops);

-- Traditional search indexes
CREATE INDEX idx_goals_search ON iris_strategic_goals USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_indicators_search ON iris_key_indicators USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_content_search ON llm_content_chunks USING gin(to_tsvector('english', content_markdown));

-- ============================================================================
-- HYBRID SEARCH FUNCTIONS
-- ============================================================================

-- Intelligent hybrid search function
CREATE OR REPLACE FUNCTION intelligent_iris_search(
    user_query TEXT,
    user_context JSONB DEFAULT '{}',
    search_intent VARCHAR(100) DEFAULT 'general',
    result_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    content_id UUID,
    content_type TEXT,
    content_name TEXT,
    content_description TEXT,
    content_markdown TEXT,
    relevance_score DECIMAL,
    explanation TEXT
) AS $$
DECLARE
    query_embedding vector(1536);
    complexity_pref INTEGER;
    org_focus_areas TEXT[];
BEGIN
    -- Extract user preferences
    complexity_pref := COALESCE((user_context->>'complexity_preference')::INTEGER, 2);
    org_focus_areas := ARRAY(SELECT jsonb_array_elements_text(user_context->'focus_areas'));
    
    -- TODO: Generate query embedding (would call external service in real implementation)
    -- For now, we'll use a placeholder vector
    query_embedding := ARRAY(SELECT random() FROM generate_series(1, 1536))::vector(1536);
    
    RETURN QUERY
    WITH vector_candidates AS (
        -- Phase 1: Fast vector similarity search
        SELECT 
            llc.id,
            llc.content_type,
            SUBSTRING(llc.content_markdown FROM 1 FOR 100) as name,
            SUBSTRING(llc.content_markdown FROM 1 FOR 500) as description,
            llc.content_markdown,
            1 - (llc.embedding <=> query_embedding) as vector_similarity,
            llc.semantic_tags
        FROM llm_content_chunks llc
        WHERE llc.context_level <= complexity_pref
        ORDER BY llc.embedding <=> query_embedding
        LIMIT result_limit * 3
    ),
    contextual_reranking AS (
        -- Phase 2: Context-aware reranking
        SELECT 
            vc.*,
            vc.vector_similarity * (
                1.0 + 
                -- Boost for matching organization focus areas
                (CASE WHEN vc.semantic_tags && org_focus_areas THEN 0.3 ELSE 0 END) +
                -- Boost for search intent alignment
                (CASE WHEN search_intent = ANY(vc.semantic_tags) THEN 0.2 ELSE 0 END)
            ) as hybrid_score,
            
            -- Generate explanation for transparency
            'Vector similarity: ' || ROUND(vc.vector_similarity::numeric, 3) ||
            CASE WHEN vc.semantic_tags && org_focus_areas 
                 THEN ' + Context match for: ' || array_to_string(org_focus_areas, ', ')
                 ELSE '' END ||
            CASE WHEN search_intent = ANY(vc.semantic_tags)
                 THEN ' + Intent alignment: ' || search_intent  
                 ELSE '' END as score_explanation
                 
        FROM vector_candidates vc
    )
    SELECT 
        cr.id,
        cr.content_type,
        cr.name,
        cr.description,
        cr.content_markdown,
        cr.hybrid_score,
        cr.score_explanation
    FROM contextual_reranking cr
    ORDER BY hybrid_score DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Dynamic context builder for LLM conversations
CREATE OR REPLACE FUNCTION build_llm_context(
    user_id UUID,
    organization_id UUID,
    query_intent VARCHAR(100),
    entity_extracts JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
    context JSONB := '{}';
    user_history JSONB;
    org_preferences JSONB;
    relevant_content JSONB;
BEGIN
    -- Get user conversation history and preferences
    SELECT jsonb_build_object(
        'recent_queries', COALESCE(array_agg(cm.content ORDER BY cm.created_at DESC), ARRAY[]::TEXT[]),
        'preferred_complexity', 
            CASE 
                WHEN avg(CASE WHEN cm.metadata->>'complexity' = 'basic' THEN 1
                             WHEN cm.metadata->>'complexity' = 'intermediate' THEN 2
                             WHEN cm.metadata->>'complexity' = 'advanced' THEN 3
                             ELSE 2 END) < 1.5 THEN 'basic'
                WHEN avg(CASE WHEN cm.metadata->>'complexity' = 'basic' THEN 1
                             WHEN cm.metadata->>'complexity' = 'intermediate' THEN 2
                             WHEN cm.metadata->>'complexity' = 'advanced' THEN 3
                             ELSE 2 END) > 2.5 THEN 'advanced'
                ELSE 'intermediate'
            END
    ) INTO user_history
    FROM conversation_messages cm
    JOIN conversations c ON c.id = cm.conversation_id
    WHERE c.user_id = build_llm_context.user_id
      AND cm.message_type = 'user'
      AND cm.created_at > NOW() - INTERVAL '30 days'
    LIMIT 10;
    
    -- Get organization context (simplified for schema example)
    SELECT jsonb_build_object(
        'organization_id', organization_id,
        'query_intent', query_intent,
        'entities', entity_extracts
    ) INTO org_preferences;
    
    -- Get relevant content using hybrid search
    SELECT jsonb_agg(
        jsonb_build_object(
            'type', content_type,
            'name', content_name,
            'description', content_description,
            'relevance_score', relevance_score
        )
    ) INTO relevant_content
    FROM intelligent_iris_search(
        COALESCE(entity_extracts->>'query_text', ''),
        jsonb_build_object('complexity_preference', 2),
        query_intent,
        15
    );
    
    -- Combine all context
    context := jsonb_build_object(
        'user_context', COALESCE(user_history, '{}'::jsonb),
        'organization_context', COALESCE(org_preferences, '{}'::jsonb),
        'relevant_content', COALESCE(relevant_content, '[]'::jsonb),
        'context_built_at', extract(epoch from now())
    );
    
    RETURN context;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MATERIALIZED VIEWS FOR LLM TRAINING
-- ============================================================================

-- Comprehensive semantic search content view
CREATE MATERIALIZED VIEW mv_semantic_search_content AS
SELECT 
    'goal' as content_type,
    id,
    name,
    description,
    embedding,
    to_tsvector('english', name || ' ' || COALESCE(description, '')) as search_vector
FROM iris_strategic_goals
WHERE embedding IS NOT NULL
UNION ALL
SELECT 
    'indicator' as content_type,
    id,
    name, 
    description,
    embedding,
    to_tsvector('english', name || ' ' || COALESCE(description, '')) as search_vector
FROM iris_key_indicators
WHERE embedding IS NOT NULL
UNION ALL
SELECT 
    'theme' as content_type,
    id,
    name,
    description,
    embedding,
    to_tsvector('english', name || ' ' || COALESCE(description, '')) as search_vector
FROM iris_impact_themes
WHERE embedding IS NOT NULL;

-- Create index on materialized view
CREATE INDEX idx_semantic_search_vector ON mv_semantic_search_content USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_semantic_search_text ON mv_semantic_search_content USING gin(search_vector);

-- Hybrid content performance view
CREATE MATERIALIZED VIEW mv_hybrid_content_performance AS
SELECT 
    content_type,
    context_level,
    avg(access_frequency) as avg_access,
    avg(completeness_score) as avg_quality,
    count(*) as chunk_count,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY access_frequency) as p95_access
FROM llm_content_chunks
GROUP BY content_type, context_level;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC MAINTENANCE
-- ============================================================================

-- Function to update embedding timestamps
CREATE OR REPLACE FUNCTION update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.embedding_updated_at = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for embedding updates
CREATE TRIGGER trigger_categories_embedding_update
    BEFORE UPDATE OF embedding ON iris_impact_categories
    FOR EACH ROW EXECUTE FUNCTION update_embedding_timestamp();

CREATE TRIGGER trigger_themes_embedding_update
    BEFORE UPDATE OF embedding ON iris_impact_themes
    FOR EACH ROW EXECUTE FUNCTION update_embedding_timestamp();

CREATE TRIGGER trigger_goals_embedding_update
    BEFORE UPDATE OF embedding ON iris_strategic_goals
    FOR EACH ROW EXECUTE FUNCTION update_embedding_timestamp();

CREATE TRIGGER trigger_indicators_embedding_update
    BEFORE UPDATE OF embedding ON iris_key_indicators
    FOR EACH ROW EXECUTE FUNCTION update_embedding_timestamp();

-- Function to update access statistics
CREATE OR REPLACE FUNCTION update_content_access_stats()
RETURNS TRIGGER AS $$
BEGIN
    NEW.access_frequency = OLD.access_frequency + 1;
    NEW.last_accessed = NOW();
    NEW.hit_rate = NEW.access_frequency::DECIMAL / GREATEST(NEW.access_frequency + 1, 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for content access tracking
CREATE TRIGGER trigger_content_access_update
    BEFORE UPDATE OF access_frequency ON llm_content_chunks
    FOR EACH ROW EXECUTE FUNCTION update_content_access_stats();

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- View for monitoring vector search performance
CREATE VIEW v_vector_search_performance AS
SELECT 
    'content_chunks' as table_name,
    count(*) as total_rows,
    count(CASE WHEN embedding IS NOT NULL THEN 1 END) as rows_with_embeddings,
    avg(access_frequency) as avg_access_frequency,
    max(last_accessed) as last_access
FROM llm_content_chunks
UNION ALL
SELECT 
    'iris_goals' as table_name,
    count(*) as total_rows,
    count(CASE WHEN embedding IS NOT NULL THEN 1 END) as rows_with_embeddings,
    0 as avg_access_frequency,
    max(embedding_updated_at) as last_access
FROM iris_strategic_goals;

-- View for cache performance monitoring
CREATE VIEW v_cache_performance AS
SELECT 
    'vector_similarity_cache' as cache_type,
    count(*) as total_entries,
    count(CASE WHEN expires_at > NOW() THEN 1 END) as active_entries,
    avg(array_length(similar_content_ids, 1)) as avg_results_per_query
FROM vector_similarity_cache
UNION ALL
SELECT 
    'intelligent_context_cache' as cache_type,
    count(*) as total_entries,
    count(CASE WHEN expires_at > NOW() THEN 1 END) as active_entries,
    avg(hit_rate) as avg_hit_rate
FROM intelligent_context_cache;

-- ============================================================================
-- SAMPLE DATA INSERTION (for development)
-- ============================================================================

-- Insert sample LLM content chunks
INSERT INTO llm_content_chunks (
    content_markdown,
    content_type,
    context_level,
    query_keywords,
    semantic_tags,
    embedding,
    source_entities,
    completeness_score
) VALUES 
(
    '# Financial Inclusion Impact Measurement

## Overview
Financial inclusion focuses on improving access to financial services for underserved populations.

## Key Indicators
- **PI5675**: Number of individuals with increased income
- **PI2389**: Percentage of individuals with access to financial services

## Implementation Guidance
1. Collect baseline financial data before intervention
2. Track changes quarterly using standardized surveys
3. Consider local economic context and inflation rates

## Calculation Methods
```sql
-- Income increase calculation
SELECT COUNT(*) as individuals_with_income_increase
FROM measurements 
WHERE current_income > baseline_income
```

## Related SDGs
- SDG 1: No Poverty
- SDG 8: Decent Work and Economic Growth',
    'goal_guidance',
    2,
    ARRAY['financial inclusion', 'income', 'poverty', 'sdg'],
    ARRAY['financial-inclusion', 'income', 'sdg-1', 'sdg-8'],
    ARRAY(SELECT random() FROM generate_series(1, 1536))::vector(1536),
    '{"iris_goal_id": "example-goal-id", "sdg_ids": ["sdg-1", "sdg-8"]}',
    0.95
);

-- This schema provides a production-ready foundation for the hybrid vector + structured content architecture
-- Remember to populate embeddings using your chosen embedding service (OpenAI, Anthropic, etc.)