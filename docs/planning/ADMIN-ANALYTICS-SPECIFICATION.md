# Admin Analytics Specification
## Learning from User Behavior at Scale

### Overview
This document specifies the comprehensive analytics system needed to learn from users quickly as we send Impact Bot v2 "far & wide for free." Our ability to rapidly understand user behavior, identify friction points, and optimize the methodology guidance will be critical for product success.

---

## 🎯 CORE LEARNING OBJECTIVES

### **1. Foundation Pathway Optimization**
**Question:** How do users best complete their theory of change foundation?
- Which pathway works best: upload vs guided vs hybrid?
- Where do users drop off in guided theory development?
- What organizational characteristics predict pathway success?

### **2. Pitfall Prevention Effectiveness**
**Question:** How well does our AI prevent measurement mistakes?
- Do users heed activity vs impact warnings?
- Which pitfall warnings are most/least effective?
- How does behavior change after warnings?

### **3. IRIS+ Discovery Optimization**
**Question:** How can we improve contextual indicator recommendations?
- Which indicators are most discovered by sector/intervention?
- How accurate are our "organizations like yours" suggestions?
- What IRIS+ gaps require custom indicator creation?

### **4. Methodology Adoption Success**
**Question:** How well are users adopting proven measurement practices?
- Are users developing learning vs proving mindsets?
- How sophisticated do decision mappings become over time?
- Which methodology guidance resonates most?

---

## 📊 ANALYTICS DASHBOARD SPECIFICATIONS

### **Foundation Analytics Dashboard**

#### **Pathway Completion Funnel**
```typescript
interface FoundationPathwayMetrics {
  totalUsers: number;
  pathwayBreakdown: {
    upload: { attempts: number; completions: number; successRate: number; };
    guided: { attempts: number; completions: number; successRate: number; };
    hybrid: { attempts: number; completions: number; successRate: number; };
  };
  averageCompletionTime: {
    upload: number; // minutes
    guided: number; // minutes
    hybrid: number; // minutes
  };
  dropOffPoints: {
    step: string;
    dropOffRate: number;
    userSegment: string;
  }[];
}
```

#### **Foundation Quality Assessment**
```typescript
interface FoundationQualityMetrics {
  readinessScores: {
    excellent: number; // 90-100%
    good: number;      // 70-89%
    basic: number;     // 50-69%
    insufficient: number; // <50%
  };
  updateFrequency: {
    within1Week: number;
    within1Month: number;
    within3Months: number;
    never: number;
  };
  logicalCoherenceScores: {
    average: number;
    byOrganizationType: { [key: string]: number };
  };
}
```

### **Pitfall Prevention Dashboard**

#### **Warning Effectiveness Analysis**
```typescript
interface PitfallPreventionMetrics {
  warningsShown: {
    activityVsImpact: number;
    proxyMetrics: number;
    overEngineering: number;
    threeLensBalance: number;
  };
  warningsHeeded: {
    activityVsImpact: number;
    proxyMetrics: number;
    overEngineering: number;
    threeLensBalance: number;
  };
  behaviorChange: {
    indicatorSelectionImprovement: number;
    portfolioBalanceImprovement: number;
    proxiesReplaced: number;
    complexityReduced: number;
  };
  effectivenessRates: {
    byPitfallType: { [key: string]: number };
    bySector: { [key: string]: number };
    byOrganizationSize: { [key: string]: number };
  };
}
```

### **IRIS+ Discovery Dashboard**

#### **Contextual Recommendation Performance**
```typescript
interface IrisDiscoveryMetrics {
  recommendationAcceptance: {
    contextualSuggestions: number;
    searchResults: number;
    similarOrganizations: number;
  };
  discoveryPatterns: {
    mostDiscoveredBySector: { [sector: string]: string[] };
    indicatorRelevanceScores: { [indicatorId: string]: number };
    customIndicatorNeeds: { [gapArea: string]: number };
  };
  userSatisfaction: {
    relevanceFeedback: number; // 1-5 scale
    discoveryEffectiveness: number;
    recommendationAccuracy: number;
  };
}
```

### **Methodology Adoption Dashboard**

#### **Learning Culture Metrics**
```typescript
interface MethodologyAdoptionMetrics {
  languageAnalysis: {
    provingLanguage: number; // % using "prove impact" language
    improvingLanguage: number; // % using "learn from" language
    contributionLanguage: number; // % using contribution vs attribution
  };
  decisionMapping: {
    averageDecisionsCaptured: number;
    decisionQualityScore: number;
    decisionEvolutionRate: number;
  };
  theoryEvolution: {
    updatesWithin3Months: number;
    averageIterations: number;
    sophisticationGrowth: number;
  };
  maturityProgression: {
    basicToIntermediate: number;
    intermediateToAdvanced: number;
    averageProgressionTime: number;
  };
}
```

---

## 🔍 EVENT TRACKING SPECIFICATIONS

### **Foundation Events**
```typescript
interface FoundationEvent {
  eventType: 'foundation_started' | 'foundation_completed' | 'foundation_updated' | 'pathway_selected';
  userId: string;
  organizationId: string;
  timestamp: Date;
  pathway: 'upload' | 'guided' | 'hybrid';
  metadata: {
    completionTime?: number;
    readinessScore?: number;
    documentsUploaded?: number;
    guidedStepsCompleted?: number;
    dropOffPoint?: string;
  };
}
```

### **Pitfall Prevention Events**
```typescript
interface PitfallEvent {
  eventType: 'warning_shown' | 'warning_dismissed' | 'warning_heeded' | 'behavior_corrected';
  userId: string;
  pitfallType: 'activity_vs_impact' | 'proxy_metrics' | 'over_engineering' | 'three_lens_balance';
  timestamp: Date;
  context: {
    indicatorsBeforeWarning: string[];
    indicatorsAfterWarning: string[];
    warningMessage: string;
    userResponse: 'ignored' | 'acknowledged' | 'corrected';
  };
}
```

### **Discovery Events**
```typescript
interface DiscoveryEvent {
  eventType: 'indicator_recommended' | 'indicator_selected' | 'indicator_rejected' | 'search_performed';
  userId: string;
  indicatorId: string;
  timestamp: Date;
  context: {
    recommendationSource: 'contextual' | 'search' | 'similar_orgs' | 'theory_alignment';
    relevanceScore: number;
    sectorContext: string;
    organizationCharacteristics: any;
  };
}
```

### **Methodology Events**
```typescript
interface MethodologyEvent {
  eventType: 'decision_mapped' | 'language_analyzed' | 'theory_updated' | 'maturity_assessed';
  userId: string;
  timestamp: Date;
  metadata: {
    decisionsCount?: number;
    languageScore?: number;
    maturityLevel?: string;
    sophisticationGrowth?: number;
  };
}
```

---

## 📈 REAL-TIME ANALYTICS APIS

### **Live Dashboard Endpoints**
```typescript
// Foundation pathway performance
GET /api/admin/analytics/foundation/live-funnel
GET /api/admin/analytics/foundation/completion-rates

// Pitfall prevention effectiveness
GET /api/admin/analytics/pitfalls/warning-effectiveness
GET /api/admin/analytics/pitfalls/behavior-changes

// IRIS+ discovery optimization
GET /api/admin/analytics/discovery/recommendation-performance
GET /api/admin/analytics/discovery/indicator-patterns

// Methodology adoption tracking
GET /api/admin/analytics/methodology/adoption-scores
GET /api/admin/analytics/methodology/maturity-progression

// Cross-cutting insights
GET /api/admin/analytics/users/journey-flow
GET /api/admin/analytics/users/friction-points
GET /api/admin/analytics/organizations/success-patterns
```

### **Batch Analytics Endpoints**
```typescript
// Historical analysis
GET /api/admin/analytics/historical/foundation-trends
GET /api/admin/analytics/historical/pitfall-effectiveness
GET /api/admin/analytics/historical/user-journey-evolution

// Cohort analysis
GET /api/admin/analytics/cohorts/pathway-performance
GET /api/admin/analytics/cohorts/success-factors

// A/B testing results
GET /api/admin/analytics/experiments/guided-conversation-variants
GET /api/admin/analytics/experiments/warning-message-effectiveness
```

---

## 🎯 KEY LEARNING QUESTIONS TO ANSWER

### **Week 1-2: Foundation Optimization**
1. **Which foundation pathway has highest completion rate?**
   - Hypothesis: Guided conversation will have higher completion but longer time
   - Metric: Completion rate by pathway within 7 days

2. **Where do users drop off in guided theory development?**
   - Hypothesis: Abstract questions about assumptions cause drop-off
   - Metric: Step-by-step completion rates in guided flow

### **Week 3-4: Pitfall Prevention Validation**
3. **Do activity vs impact warnings change behavior?**
   - Hypothesis: Strong warnings will improve outcome/impact indicator selection
   - Metric: Portfolio balance before/after warnings

4. **Which warning messages are most effective?**
   - Hypothesis: Educational warnings outperform prescriptive warnings
   - Metric: Warning heeded rate by message type

### **Week 5-8: IRIS+ Discovery Optimization**
5. **How accurate are "organizations like yours" suggestions?**
   - Hypothesis: Sector + size matching will have >70% relevance rating
   - Metric: User relevance feedback scores

6. **Which IRIS+ gaps require custom indicators most?**
   - Hypothesis: Mental health and disability sectors will need most custom indicators
   - Metric: Custom indicator creation rate by sector

### **Week 9-12: Methodology Adoption Assessment**
7. **Are users adopting learning vs proving language?**
   - Hypothesis: Guidance will shift language from "prove" to "learn" terminology
   - Metric: Natural language analysis of user inputs over time

8. **How sophisticated do decision mappings become?**
   - Hypothesis: Decision mapping quality will improve with usage
   - Metric: Decision specificity and actionability scores

---

## 🚀 IMPLEMENTATION PRIORITIES

### **Phase 1: Core Event Tracking (Week 1-2)**
- Foundation pathway events
- Pitfall warning events
- Basic user journey tracking
- Real-time dashboard framework

### **Phase 2: Behavior Analysis (Week 3-4)**
- Warning effectiveness measurement
- Behavior change detection
- Portfolio balance analysis
- Drop-off point identification

### **Phase 3: Pattern Recognition (Week 5-8)**
- Cross-organizational learning
- Contextual recommendation optimization
- IRIS+ gap pattern analysis
- Success factor identification

### **Phase 4: Advanced Analytics (Week 9-12)**
- Natural language analysis for methodology adoption
- Predictive user success modeling
- A/B testing framework
- Automated insight generation

---

## 📊 SUCCESS METRICS FOR ANALYTICS SYSTEM

### **Data Collection Quality**
- **95%** event tracking uptime
- **<100ms** analytics API response time
- **100%** user consent for analytics tracking
- **Zero** PII in analytics data

### **Learning Velocity**
- **Weekly** actionable insights generation
- **<24 hours** time from event to dashboard
- **5+ experiments** running simultaneously
- **>80%** statistical confidence in findings

### **Product Optimization Impact**
- **20%** improvement in foundation completion rates
- **15%** improvement in pitfall warning effectiveness
- **25%** improvement in indicator relevance scores
- **30%** improvement in methodology adoption metrics

---

Last Updated: December 2024
Version: 1.0 - Comprehensive Analytics Specification