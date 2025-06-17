# Production Database Design - Impact Bot IRIS+ Platform

## Design Principles

### 1. **LLM Training Optimization**
- Denormalized views for fast context retrieval
- Full-text search on all descriptive fields
- Materialized views for complex relationship queries
- Vector embeddings for semantic search (future)

### 2. **Scalability & Performance**
- Proper indexing on all foreign keys and search fields
- Partitioning for large tables (indicators, data_needed)
- Connection pooling and query optimization
- Horizontal scaling preparation

### 3. **Modular Architecture**
- Core IRIS+ framework (immutable reference data)
- User/Organization data (isolated per tenant)
- Custom indicators and metrics (extensible)
- Conversation and interaction logs (separate schema)

### 4. **Data Integrity**
- Foreign key constraints with proper cascading
- Check constraints for business rules
- Audit trails on all user-generated content
- Version control for schema changes

## Core Schema Structure

### **Reference Data Layer (iris_* tables)**
Immutable IRIS+ framework data imported from Airtable

```sql
-- Core taxonomy hierarchy
iris_impact_categories (17 records)
iris_impact_themes (28 records) 
iris_strategic_goals (72 records)
iris_key_dimensions (15 records)
iris_core_metric_sets (159 records)
iris_key_indicators (731 records)
iris_data_requirements (787 records)

-- Supporting reference data
sustainable_development_goals (17 records)
sdg_targets
sdg_indicators

-- Junction tables for many-to-many relationships
iris_theme_goals (141 records)
iris_goal_sdgs (135 records) 
iris_goal_key_dimensions (354 records)
iris_key_dimension_core_metric_sets (636 records)
iris_core_metric_set_indicators (1,755 records)
iris_indicator_data_requirements (3,125 records)
```

### **User/Organization Layer (user_* tables)**
Tenant-isolated user data with proper RBAC

```sql
-- Authentication & Authorization
users
organizations
user_organizations (many-to-many with roles)
permissions
role_permissions

-- User-generated content
user_custom_indicators
user_measurements
user_reports
user_saved_queries
```

### **Conversation Layer (conversation_* tables)**
LLM interaction tracking and optimization

```sql
-- Conversation management
conversations
conversation_messages
conversation_context (for maintaining state)
conversation_recommendations

-- LLM training data
query_patterns
recommendation_feedback
usage_analytics
```

### **System Layer (system_* tables)**
Infrastructure and monitoring

```sql
-- Audit and monitoring
audit_logs
system_health_metrics
data_sync_status
cache_statistics
```

## Performance Optimization Strategy

### **Indexing Strategy**
```sql
-- Core relationship traversal
CREATE INDEX idx_themes_category ON iris_impact_themes(category_id);
CREATE INDEX idx_goals_theme ON iris_theme_goals(theme_id, goal_id);
CREATE INDEX idx_indicators_goal ON iris_goal_indicators(goal_id);

-- Full-text search
CREATE INDEX idx_goals_search ON iris_strategic_goals USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_indicators_search ON iris_key_indicators USING gin(to_tsvector('english', name || ' ' || description));

-- User data isolation
CREATE INDEX idx_measurements_org ON user_measurements(organization_id, created_at);
CREATE INDEX idx_conversations_user ON conversations(user_id, created_at);
```

### **Materialized Views for LLM Context**
```sql
-- Pre-computed relationship chains for fast retrieval
CREATE MATERIALIZED VIEW mv_category_to_data_requirements AS
SELECT DISTINCT 
    c.id as category_id,
    c.name as category_name,
    dr.id as data_requirement_id,
    dr.name as data_requirement_name,
    dr.description,
    dr.calculation_guidance,
    array_agg(DISTINCT t.name) as themes,
    array_agg(DISTINCT g.name) as goals,
    array_agg(DISTINCT i.name) as indicators
FROM iris_impact_categories c
JOIN iris_impact_themes t ON t.category_id = c.id
JOIN iris_theme_goals tg ON tg.theme_id = t.id  
JOIN iris_strategic_goals g ON g.id = tg.goal_id
-- ... continue through full chain
GROUP BY c.id, c.name, dr.id, dr.name, dr.description, dr.calculation_guidance;

-- SDG-focused view for impact alignment
CREATE MATERIALIZED VIEW mv_sdg_to_indicators AS
SELECT DISTINCT
    s.id as sdg_id,
    s.name as sdg_name,
    i.id as indicator_id,
    i.name as indicator_name,
    i.calculation_guidance,
    count(*) as relationship_strength
FROM sustainable_development_goals s
JOIN iris_goal_sdgs gs ON gs.sdg_id = s.id
-- ... continue through chain
GROUP BY s.id, s.name, i.id, i.name, i.calculation_guidance;
```

### **Query Patterns for LLM Context**
```sql
-- Fast category-based recommendations
SELECT mv.* FROM mv_category_to_data_requirements mv 
WHERE mv.category_name ILIKE '%{user_category}%'
ORDER BY array_length(mv.goals, 1) DESC
LIMIT 10;

-- Cross-cutting theme analysis  
SELECT 
    t1.name as theme1,
    t2.name as theme2,
    count(*) as shared_goals
FROM iris_theme_goals tg1
JOIN iris_theme_goals tg2 ON tg1.goal_id = tg2.goal_id AND tg1.theme_id < tg2.theme_id
JOIN iris_impact_themes t1 ON t1.id = tg1.theme_id
JOIN iris_impact_themes t2 ON t2.id = tg2.theme_id  
GROUP BY t1.name, t2.name
ORDER BY shared_goals DESC;

-- User context preservation
SELECT 
    c.id,
    c.context_data,
    cr.recommended_indicators,
    cr.confidence_score
FROM conversations c
LEFT JOIN conversation_recommendations cr ON cr.conversation_id = c.id
WHERE c.user_id = ? AND c.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY c.updated_at DESC;
```

## Modular Development Architecture

### **Module 1: Core IRIS+ Engine**
- Reference data management
- Relationship traversal APIs
- Search and recommendation engine

### **Module 2: User Management & Tenancy**  
- Multi-tenant organization support
- Role-based access control
- User preference management

### **Module 3: Custom Indicators & Measurements**
- User-defined indicator creation
- Data collection workflows
- Progress tracking and reporting

### **Module 4: LLM Conversation Engine**
- Context-aware recommendation system
- Conversation state management
- Learning from user feedback

### **Module 5: Analytics & Insights**
- Cross-organizational benchmarking
- Usage pattern analysis
- Impact measurement insights

### **Module 6: Integration Layer**
- Airtable synchronization
- Third-party data sources
- API gateway and rate limiting

## Data Import & Synchronization Strategy

### **Airtable Sync Pipeline**
```python
class AirtableSync:
    def sync_reference_data(self):
        # 1. Import core entities with dependency order
        self.import_categories()  # 17 records
        self.import_themes()      # 28 records  
        self.import_goals()       # 72 records
        self.import_indicators()  # 731 records
        self.import_data_reqs()   # 787 records
        
        # 2. Import junction table relationships
        self.import_theme_goals()      # 141 relationships
        self.import_goal_sdgs()        # 135 relationships
        self.import_indicator_chains() # 3,125+ relationships
        
        # 3. Refresh materialized views
        self.refresh_mv_views()
        
        # 4. Update search indexes
        self.update_search_indexes()
```

### **Change Detection & Incremental Updates**
- Track Airtable record modification timestamps
- Implement delta sync for changed records only
- Maintain data lineage and version history
- Rollback capability for failed syncs

## Deployment & Scaling Strategy

### **Development Environment**
- Docker Compose with PostgreSQL 15+
- Redis for caching and session management
- Local Airtable sync for development data

### **Production Environment**  
- PostgreSQL cluster with read replicas
- Connection pooling (PgBouncer)
- Redis Cluster for distributed caching
- Monitoring with Prometheus/Grafana

### **Scaling Considerations**
- Horizontal partitioning for user data by organization
- Vertical partitioning for hot/cold data separation
- CDN for static reference data
- API rate limiting and throttling

## Security & Compliance

### **Data Protection**
- Encryption at rest and in transit
- PII tokenization for sensitive user data
- Audit logging for all data access
- GDPR compliance for user data deletion

### **Access Control**
- JWT-based authentication
- Fine-grained RBAC permissions
- API key management for integrations
- IP allowlisting for administrative access

## Monitoring & Observability

### **Performance Metrics**
- Query execution times
- Cache hit rates
- API response times
- Database connection pool utilization

### **Business Metrics**
- User engagement patterns
- Recommendation accuracy
- Data quality scores
- System usage trends

This design provides a solid foundation for a production-ready, scalable impact measurement platform that can grow with your needs while maintaining performance and data integrity.