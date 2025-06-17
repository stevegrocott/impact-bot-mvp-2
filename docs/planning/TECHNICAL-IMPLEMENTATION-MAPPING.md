# Technical Implementation Mapping
## Methodology-Driven User Stories to Technical Architecture

### Overview
This document maps the methodology-driven user stories (including comprehensive custom indicator support) to the existing technical architecture, identifying implementation requirements, code changes, and system enhancements needed.

---

## 🎯 PHASE 1: Foundation & Theory Capture
*Essential inputs that determine measurement success*

### **Foundation Context Capture**
**User Story:** Upload theory of change documents or engage in guided conversation development

**Current Implementation Status:** ✅ **IMPLEMENTED**
- **Existing:** `/backend/src/controllers/conversationController.ts`
- **Routes:** `/backend/src/routes/conversations.ts`
- **Database:** `Conversation`, `ConversationMessage` models in Prisma schema

**Technical Gaps for Enhancement:**
```typescript
// NEEDED: Document upload and parsing service
interface DocumentParsingService {
  uploadDocument(file: File, conversationId: string): Promise<ParsedDocument>;
  extractTheoryOfChange(content: string): Promise<TheoryOfChangeStructure>;
  validateCompleteness(theory: TheoryOfChangeStructure): Promise<GapAnalysis>;
}

// NEEDED: Theory of Change data model
interface TheoryOfChangeStructure {
  targetPopulation: string;
  problemDefinition: string;
  activities: string[];
  outputs: string[];
  shortTermOutcomes: string[];
  longTermOutcomes: string[];
  impacts: string[];
  assumptions: string[];
  externalFactors: string[];
}
```

**Implementation Requirements:**
1. **NEW:** `POST /api/v1/organizations/foundation/upload-documents`
2. **NEW:** `POST /api/v1/organizations/foundation/guided-setup` 
3. **NEW:** Document parsing service with PDF/Word/PowerPoint support
4. **NEW:** Theory of Change synthesis and storage
5. **ENHANCE:** Conversation controller with theory development flow

---

### **Organizational Context Synthesis**
**User Story:** System understands and remembers organizational context for relevant recommendations

**Current Implementation Status:** ⚠️ **PARTIALLY IMPLEMENTED**
- **Existing:** `Organization` model with basic fields
- **Missing:** Context synthesis, constraint analysis, priority weighting

**Technical Gaps:**
```typescript
// NEEDED: Enhanced Organization model
interface EnhancedOrganizationContext {
  // Basic info (EXISTS)
  name: string;
  industry: string;
  
  // NEEDED: Context fields
  capacity: {
    budget: string;
    timeline: string;
    teamSize: number;
    technicalSkills: string[];
  };
  constraints: {
    regulatory: string[];
    cultural: string[];
    geographic: string[];
  };
  priorities: {
    stakeholders: StakeholderPriority[];
    reportingRequirements: string[];
    impactAreas: string[];
  };
  existingSystems: string[];
}
```

**Implementation Requirements:**
1. **ENHANCE:** Organization Prisma model with context fields
2. **NEW:** Context synthesis algorithms in hybrid content service
3. **NEW:** Priority weighting system for AI recommendations
4. **ENHANCE:** All recommendation engines to use organizational context
5. **NEW:** Context versioning and history tracking

---

## 🎯 PHASE 2: AI-Powered Metric Design
*AI-powered indicator selection with methodology rigor*

### **Theory-Aligned Indicator Selection**
**User Story:** Verify selected indicators align with theory of change logic

**Current Implementation Status:** ✅ **BASIC IMPLEMENTATION**
- **Existing:** `/backend/src/controllers/indicatorSelectionController.ts`
- **Existing:** IRIS+ indicator selection workflow
- **Routes:** `/backend/src/routes/indicators.ts`

**Technical Gaps for Theory Alignment:**
```typescript
// NEEDED: Theory alignment analysis service
interface TheoryAlignmentService {
  analyzeAlignment(
    indicators: SelectedIndicator[],
    theoryOfChange: TheoryOfChangeStructure
  ): Promise<AlignmentAnalysis>;
  
  identifyGaps(alignment: AlignmentAnalysis): Promise<string[]>;
  
  suggestMissingIndicators(
    gaps: string[],
    organizationContext: OrganizationContext
  ): Promise<IndicatorSuggestion[]>;
}

// NEEDED: Alignment analysis results
interface AlignmentAnalysis {
  outputsCovered: number;
  outcomesCovered: number;
  impactsCovered: number;
  assumptionsTested: number;
  criticalPathCoverage: number;
  gaps: TheoryGap[];
}
```

**Implementation Requirements:**
1. **NEW:** `POST /api/v1/indicators/theory-alignment-analysis`
2. **NEW:** Theory alignment service with gap identification
3. **ENHANCE:** Indicator selection controller with alignment validation
4. **NEW:** Critical pathway coverage analysis
5. **NEW:** Missing indicator suggestion engine

---

### **Custom Indicator Development**
**User Story:** Create custom indicators for gaps not covered by IRIS+

**Current Implementation Status:** ⚠️ **BASIC STRUCTURE EXISTS**
- **Existing:** `UserCustomIndicator` model in Prisma schema
- **Missing:** Development workflow, validation, IRIS+ gap analysis

**Technical Gaps for Comprehensive Custom Indicators:**
```typescript
// NEEDED: Custom indicator development service
interface CustomIndicatorService {
  analyzeIrisGaps(
    theoryOfChange: TheoryOfChangeStructure,
    selectedIrisIndicators: string[]
  ): Promise<IrisGapAnalysis>;
  
  createCustomIndicator(
    request: CustomIndicatorRequest
  ): Promise<CustomIndicator>;
  
  validateAgainstSMART(
    indicator: CustomIndicator
  ): Promise<SMARTValidation>;
  
  suggestDataCollection(
    indicator: CustomIndicator
  ): Promise<DataCollectionPlan>;
}

// NEEDED: Custom indicator types
interface CustomIndicatorRequest {
  organizationId: string;
  name: string;
  description: string;
  indicatorType: 'community_defined' | 'innovation' | 'sector_specific' | 'organization_specific';
  targetOutcome: string;
  measurementApproach: 'quantitative' | 'qualitative' | 'mixed';
  dataCollectionMethod: string;
  frequency: string;
  smartCriteria: SMARTCriteria;
}
```

**Implementation Requirements:**
1. **NEW:** `POST /api/v1/indicators/analyze-iris-gaps`
2. **NEW:** `POST /api/v1/indicators/custom-create`
3. **NEW:** Custom indicator development workflow
4. **NEW:** IRIS+ gap analysis engine
5. **NEW:** SMART criteria validation for custom indicators
6. **NEW:** Community indicator development tools
7. **ENHANCE:** Integration between custom and IRIS+ indicators

---

## 🎯 PHASE 3: Data Strategy Design
*AI-guided ethical and robust data collection design*

### **Custom Indicator Data Collection Planning**
**User Story:** Design data collection methods for custom indicators with IRIS+ quality standards

**Current Implementation Status:** ❌ **NOT IMPLEMENTED**
- **Missing:** Data collection planning for custom indicators
- **Missing:** Quality standard validation
- **Missing:** Ethical guidelines generation

**Technical Requirements:**
```typescript
// NEEDED: Data collection planning service
interface DataCollectionPlanningService {
  generateCollectionPlan(
    indicator: CustomIndicator,
    organizationContext: OrganizationContext
  ): Promise<DataCollectionPlan>;
  
  validateQualityStandards(
    plan: DataCollectionPlan
  ): Promise<QualityValidation>;
  
  generateEthicalGuidelines(
    plan: DataCollectionPlan
  ): Promise<EthicalGuidelines>;
  
  suggestValidationProtocols(
    indicator: CustomIndicator
  ): Promise<ValidationProtocol>;
}

interface DataCollectionPlan {
  methods: DataCollectionMethod[];
  frequency: string;
  sampleSize: number;
  dataQualityControls: QualityControl[];
  ethicalConsiderations: EthicalConsideration[];
  integrationWithExisting: IntegrationPlan;
}
```

**Implementation Requirements:**
1. **NEW:** `POST /api/v1/indicators/custom/:id/data-collection-design`
2. **NEW:** Data collection planning service
3. **NEW:** Quality standards validation for custom indicators
4. **NEW:** Ethical guidelines generation
5. **NEW:** Integration with existing data collection workflows
6. **NEW:** Training material generation for custom indicators

---

## 🎯 PHASE 4: Analysis & Interpretation
*AI-enhanced analytical rigor for custom indicators*

### **Custom Indicator Statistical Analysis**
**User Story:** Appropriate statistical analysis guidance for custom indicators

**Current Implementation Status:** ❌ **NOT IMPLEMENTED**
- **Missing:** Statistical analysis for custom indicators
- **Missing:** Benchmarking without standard comparisons
- **Missing:** Integration with IRIS+ analysis

**Technical Requirements:**
```typescript
// NEEDED: Custom indicator analysis service
interface CustomIndicatorAnalysisService {
  recommendStatisticalMethods(
    indicator: CustomIndicator,
    dataType: DataType
  ): Promise<StatisticalMethodRecommendation[]>;
  
  createBenchmarks(
    indicator: CustomIndicator,
    organizationContext: OrganizationContext
  ): Promise<BenchmarkFramework>;
  
  integrateWithIrisAnalysis(
    customResults: CustomIndicatorResults,
    irisResults: IrisIndicatorResults
  ): Promise<IntegratedAnalysis>;
  
  validateReliability(
    indicator: CustomIndicator,
    dataSet: DataSet
  ): Promise<ReliabilityAssessment>;
}
```

**Implementation Requirements:**
1. **NEW:** `POST /api/v1/analysis/custom-indicators`
2. **NEW:** Statistical method recommendation engine for custom indicators
3. **NEW:** Benchmark development for unique indicators
4. **NEW:** Reliability and validity testing tools
5. **NEW:** Integration framework between custom and IRIS+ analysis
6. **NEW:** Confidence level documentation for custom measures

---

## 🎯 PHASE 5: Learning & Communication
*Custom indicator performance and knowledge sharing*

### **Custom Indicator Performance Evaluation**
**User Story:** Evaluate custom indicator performance vs IRIS+ indicators

**Current Implementation Status:** ❌ **NOT IMPLEMENTED**
- **Missing:** Performance comparison framework
- **Missing:** Decision support for indicator lifecycle
- **Missing:** Knowledge sharing platform

**Technical Requirements:**
```typescript
// NEEDED: Custom indicator evaluation service
interface CustomIndicatorEvaluationService {
  comparePerformance(
    customIndicators: CustomIndicator[],
    irisIndicators: IrisIndicator[]
  ): Promise<PerformanceComparison>;
  
  analyzeBurdenBenefit(
    indicator: CustomIndicator
  ): Promise<BurdenBenefitAnalysis>;
  
  collectStakeholderFeedback(
    indicator: CustomIndicator
  ): Promise<StakeholderFeedback>;
  
  recommendLifecycleAction(
    indicator: CustomIndicator,
    performance: PerformanceData
  ): Promise<LifecycleRecommendation>;
}

// NEEDED: Knowledge sharing platform
interface KnowledgeSharingService {
  shareCustomIndicator(
    indicator: CustomIndicator,
    methodology: string
  ): Promise<SharedIndicatorId>;
  
  enablePeerReview(
    sharedIndicator: SharedIndicatorId
  ): Promise<PeerReviewWorkflow>;
  
  analyzeCrossOrganizationPatterns(
    sector?: string
  ): Promise<CustomIndicatorTrends>;
}
```

**Implementation Requirements:**
1. **NEW:** `GET /api/v1/indicators/custom/performance-evaluation`
2. **NEW:** `POST /api/v1/indicators/custom/share`
3. **NEW:** Performance comparison analysis tools
4. **NEW:** Custom indicator sharing platform
5. **NEW:** Peer review workflow systems
6. **NEW:** Cross-organization pattern analysis
7. **NEW:** IRIS+ recommendation generation from custom patterns

---

## 🔄 IMPLEMENTATION PRIORITY MATRIX

### **Phase 1: Core Custom Indicator Foundation (Weeks 1-4)**
**High Priority - Foundation Requirements:**
1. **Enhanced Organization Context Model**
   - Add context fields to Prisma schema
   - Context synthesis service
   - Priority weighting algorithms

2. **Theory of Change Integration**
   - Document upload service
   - Theory extraction and storage
   - Gap identification

3. **Basic Custom Indicator Creation**
   - Custom indicator development workflow
   - SMART criteria validation
   - Integration with existing IRIS+ selection

### **Phase 2: Custom Indicator Data & Analysis (Weeks 5-8)**
**High Priority - Core Functionality:**
1. **Data Collection Planning**
   - Collection method recommendations
   - Quality standards validation
   - Ethical guidelines generation

2. **Statistical Analysis Framework**
   - Method recommendation engine
   - Reliability testing tools
   - Integration with IRIS+ analysis

### **Phase 3: Advanced Features & Sharing (Weeks 9-12)**
**Medium Priority - Enhanced Capabilities:**
1. **Performance Evaluation**
   - Comparison frameworks
   - Lifecycle decision support
   - Stakeholder feedback integration

2. **Knowledge Sharing Platform**
   - Custom indicator sharing
   - Peer review workflows
   - Cross-organization learning

### **Phase 4: Integration & Optimization (Weeks 13-16)**
**Medium Priority - System Enhancement:**
1. **Advanced Analytics**
   - Pattern recognition across organizations
   - IRIS+ enhancement recommendations
   - Predictive performance modeling

2. **User Experience Optimization**
   - Streamlined workflows
   - Enhanced visualization
   - Mobile support

---

## 🗄️ DATABASE ENHANCEMENTS REQUIRED

### **New Tables Needed:**
```sql
-- Theory of Change storage
CREATE TABLE organization_theory_of_change (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  target_population TEXT,
  problem_definition TEXT,
  activities JSONB,
  outputs JSONB,
  short_term_outcomes JSONB,
  long_term_outcomes JSONB,
  impacts JSONB,
  assumptions JSONB,
  external_factors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom indicator data collection plans
CREATE TABLE custom_indicator_data_collection_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  custom_indicator_id UUID REFERENCES user_custom_indicators(id),
  collection_methods JSONB,
  frequency VARCHAR(100),
  sample_size INTEGER,
  quality_controls JSONB,
  ethical_guidelines JSONB,
  validation_protocols JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom indicator performance tracking
CREATE TABLE custom_indicator_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  custom_indicator_id UUID REFERENCES user_custom_indicators(id),
  data_quality_score INTEGER,
  collection_burden_score INTEGER,
  stakeholder_satisfaction DECIMAL(3,2),
  reliability_score DECIMAL(3,2),
  validity_score DECIMAL(3,2),
  usage_count INTEGER DEFAULT 0,
  evaluation_period_start DATE,
  evaluation_period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge sharing platform
CREATE TABLE shared_custom_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_indicator_id UUID REFERENCES user_custom_indicators(id),
  sharing_organization_id UUID REFERENCES organizations(id),
  methodology_documentation TEXT,
  peer_review_status VARCHAR(50) DEFAULT 'pending',
  download_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  tags JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Enhanced Existing Tables:**
```sql
-- Add context fields to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS capacity_data JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS constraints_data JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS priorities_data JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS theory_of_change_id UUID REFERENCES organization_theory_of_change(id);

-- Enhance custom indicators with development metadata
ALTER TABLE user_custom_indicators ADD COLUMN IF NOT EXISTS indicator_type VARCHAR(100) DEFAULT 'organization_specific';
ALTER TABLE user_custom_indicators ADD COLUMN IF NOT EXISTS iris_gap_analysis JSONB DEFAULT '{}';
ALTER TABLE user_custom_indicators ADD COLUMN IF NOT EXISTS smart_validation JSONB DEFAULT '{}';
ALTER TABLE user_custom_indicators ADD COLUMN IF NOT EXISTS data_collection_plan_id UUID REFERENCES custom_indicator_data_collection_plans(id);
```

---

## 🚀 API ENDPOINTS TO IMPLEMENT

### **Foundation & Theory Endpoints:**
```typescript
// Theory of Change management
POST   /api/v1/organizations/foundation/upload-documents
POST   /api/v1/organizations/foundation/guided-setup
GET    /api/v1/organizations/foundation/readiness-assessment
PUT    /api/v1/organizations/foundation/theory-of-change
```

### **Custom Indicator Development:**
```typescript
// Custom indicator creation and management
POST   /api/v1/indicators/analyze-iris-gaps
POST   /api/v1/indicators/custom-create
POST   /api/v1/indicators/custom/:id/validate-smart
POST   /api/v1/indicators/custom/:id/data-collection-design
GET    /api/v1/indicators/custom/:id/performance-evaluation
```

### **Analysis & Learning:**
```typescript
// Custom indicator analysis
POST   /api/v1/analysis/custom-indicators
POST   /api/v1/analysis/integrate-custom-iris
GET    /api/v1/analysis/custom-indicator-benchmarks
```

### **Knowledge Sharing:**
```typescript
// Knowledge sharing platform
POST   /api/v1/indicators/custom/share
GET    /api/v1/indicators/shared/search
POST   /api/v1/indicators/shared/:id/review
GET    /api/v1/indicators/patterns/cross-organization
```

---

## 📊 METRICS & SUCCESS CRITERIA

### **Implementation Success Metrics:**
- **Foundation Capture:** 95% of users complete theory of change before proceeding
- **Custom Indicators:** 60% of organizations create at least one custom indicator
- **Quality Standards:** Custom indicators meet 85% of SMART criteria validation
- **Integration:** 90% successful integration between custom and IRIS+ indicators
- **Knowledge Sharing:** 40% of custom indicators shared across organizations
- **Performance:** Custom indicators show 80% reliability scores

### **User Experience Metrics:**
- **Workflow Completion:** 75% complete custom indicator development workflow
- **Satisfaction:** 4.2/5 average rating for custom indicator tools
- **Usage:** 70% continue using custom indicators beyond initial creation
- **Learning:** 85% report improved measurement approach through custom indicators

---

## 🔧 TECHNICAL DEBT & REFACTORING

### **Current Code Enhancements Needed:**
1. **Conversation Controller:** Add theory of change conversation flows
2. **Indicator Selection Controller:** Enhance with custom indicator creation
3. **Hybrid Content Service:** Add custom indicator content assembly
4. **LLM Service:** Enhance with custom indicator guidance prompts
5. **Database Schema:** Add custom indicator lifecycle tables

### **New Services Required:**
1. **DocumentParsingService:** PDF/Word/PowerPoint processing
2. **TheoryAlignmentService:** Gap analysis and validation
3. **CustomIndicatorService:** Development workflow management
4. **DataCollectionPlanningService:** Method recommendations
5. **KnowledgeSharingService:** Cross-organization learning platform

---

Last Updated: December 2024
Version: 1.0 - Technical Implementation Mapping for Custom Indicators