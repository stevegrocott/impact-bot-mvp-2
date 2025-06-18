# Impact Bot Interface Design Brief
*Foundation-First Conversational Impact Measurement Platform*

## Executive Summary

Impact Bot is a conversational AI platform built on the IRIS+ framework that prevents common measurement pitfalls through foundation-first methodology. The interface prioritizes user agency while maintaining technical rigor, offering three distinct interaction modes: Chat-First, Visual Dashboards, and Quick Start.

## Core Design Philosophy

### Foundation-First Methodology
- **Theory of Change** must be established before indicator access
- **Decision Mapping** unlocks advanced features
- **Progressive Enhancement** based on foundation readiness score
- **Pitfall Prevention** through technical enforcement of proven methodology

### User Agency Principles
- **Mode Selection**: Users choose their preferred interaction style
- **Personality Customization**: AI guide personality matches user preferences
- **Context Switching**: Seamless transitions between modes
- **Progress Preservation**: No work lost when switching approaches

## User Interaction Modes

### 1. Chat-First Mode (Default)
**Target Users**: First-time users, complex programs, preference for guided experience
**Time Expectation**: 15-25 minutes to foundation completion
**Success Metric**: Foundation score >30%

**Key Features**:
- Conversational onboarding with AI personalities
- Real-time suggestions and pitfall warnings
- Contextual help and methodology explanations
- Progressive disclosure of platform features

### 2. Visual Dashboard Mode
**Target Users**: M&E professionals, bulk data imports, multi-program management
**Time Expectation**: 20+ minutes for comprehensive setup
**Success Metric**: ≥5 indicators selected + theory drafted

**Key Features**:
- Structured forms with inline editing
- Bulk import/export capabilities
- Multi-program context switching
- Advanced data visualization tools

### 3. Quick Start Mode
**Target Users**: Time-pressed founders, initial drafts, rapid prototyping
**Time Expectation**: 10 minutes for starter plan
**Success Metric**: Plan generated + exported

**Key Features**:
- Smart defaults based on organization type
- Rapid-fire question sequence
- Template-based generation
- Refinement opportunities post-generation

## AI Personality System

### Coach Riley (Encouraging, Casual)
- **Tone**: Supportive, energetic, startup-friendly
- **Language**: "Let's build something amazing! I'll cheer you on."
- **Best For**: First-time users, entrepreneurs, small teams

### Advisor Morgan (Clear, Formal)
- **Tone**: Professional, structured, methodology-focused
- **Language**: "I'll provide structured guidance based on proven methodology."
- **Best For**: Established organizations, formal reporting requirements

### Analyst Alex (Precise, Technical)
- **Tone**: Data-driven, rigorous, academic
- **Language**: "Consider validity threats and statistical significance."
- **Best For**: M&E professionals, researchers, technical teams

## User Interface Architecture

### Welcome Flow
```
┌─────────────────────────────────────────────────────────┐
│                    Welcome to Impact Bot                │
│               How do you want to get started?           │
│                                                         │
│  🤖 Guided Chat                                         │
│     Let AI walk you through each step                   │
│     Best for: First-time users, complex programs        │
│     Time: ~15-25 minutes                               │
│                                                         │
│  📊 Visual Dashboards                                   │
│     Jump straight to structured forms and data views    │
│     Best for: M&E professionals, bulk imports           │
│     Time: ~20+ minutes                                 │
│                                                         │
│  ⚡ Quick Start                                         │
│     Generate a starter plan with smart defaults         │
│     Best for: Time-pressed founders, initial drafts     │
│     Time: ~10 minutes                                  │
│                                                         │
│           [Continue] or [Learn More About Each]         │
└─────────────────────────────────────────────────────────┘
```

### Navigation System
**Progressive Disclosure Based on Foundation Readiness**:
- **Foundation**: Always accessible, shows progress
- **Indicators**: Unlocked at 30% foundation score
- **Reports**: Unlocked when first indicators selected
- **Approvals**: Unlocked when first report drafted
- **Collaboration**: Available throughout

### Visual Mode Layout
```
┌──────────────────┬─────────────────────────────────────┬──────────────┐
│ Program Selector │ Main Workspace                      │ AI Assistant │
│                  │                                     │              │
│ 📚 Education Prog│ ┌─ Theory of Change Builder ──┐     │ 💡 Suggestions│
│ 🏥 Health Prog   │ │ Target: Youth literacy       │     │              │
│ 🌱 Overall Org   │ │ Problem: [Edit inline]       │     │ "Consider    │
│                  │ │ Activities: [+ Add]          │     │ adding reading│
│ ─────────────────│ │ Outcomes: [+ Add]           │     │ comprehension │
│ Quick Actions    │ └─────────────────────────────┘     │ indicators"   │
│ • Bulk Import    │                                     │              │
│ • Export Report  │ ┌─ Indicator Library ─────────┐     │ [Ask Question]│
│ • Copy Template  │ │ [Search IRIS+] 🔍           │     │ [Show Guide] │
│                  │ │ ☑ Reading Level Improvement  │     │              │
│ [Switch to Chat] │ │ ☐ School Attendance Rate    │     │              │
└──────────────────┴─────────────────────────────────────┴──────────────┘
```

## Backend Integration Points

### Foundation Assessment API
- `GET /api/v1/foundation/status` - Foundation readiness score
- `POST /api/v1/theory-of-change/upload-documents` - Document parsing
- `GET /api/v1/theory-of-change/foundation-readiness` - Readiness assessment

### Decision Mapping API
- `POST /api/v1/foundation/decisions` - Decision question creation
- `GET /api/v1/foundation/decisions` - Decision context retrieval

### IRIS+ Integration
- `GET /api/v1/indicators/search` - Contextual indicator discovery
- `GET /api/v1/indicators/recommendations` - AI-powered suggestions
- `POST /api/v1/measurements/bulk-import` - Data import capabilities

### Conversation Management
- `POST /api/v1/conversations/message` - Chat message handling
- `GET /api/v1/conversations/{id}/recommendations` - AI recommendations
- `PUT /api/v1/conversations/{id}/feedback` - User feedback tracking

## Success Metrics & Behavioral Triggers

### Engagement Metrics
- **Indicator Discovery**: % who bookmark ≥1 indicator within 7 minutes
- **Mode Flexibility**: % who switch modes and return (engagement indicator)
- **Decision Mapping**: % who complete ≥1 decision question in first session
- **Foundation Progress**: % who reach 30%+ foundation score within first week

### Usage Pattern Analysis
- **Decision Categories**: Track most requested (Budget → Program → Scaling → Fundraising)
- **Pitfall Triggers**: Intervention when users select >10 indicators
- **Support Escalation**: Identify where users most often need help

### Quality Indicators
- **Time to First Value**: <15 minutes across all modes
- **Foundation Completion Rate**: >80% of started foundations completed
- **Decision Informed**: Survey metric on whether measurement actually informed decisions

## Error Handling & User Support

### Enhanced Error States
```
Instead of: "Request failed with status code 500"
Show: "🚧 Foundation Setup Temporarily Unavailable
       
       We're having trouble loading your foundation data.
       Here's what you can do:
       
       ✅ Try refreshing the page
       ✅ Check our status page  
       ✅ Start with Chat if this persists
       
       [Refresh] [Status Page] [Go to Chat]
       
       Still stuck? Contact support with error: F500"
```

### Contextual Help System
- **Floating Chat Button**: Always visible, context-aware
- **Progressive Hints**: "Most education nonprofits start with learning outcomes"
- **Methodology Explanations**: [ℹ️ Why this?] tooltips on recommendations
- **Video Tutorials**: Embedded at key decision points

## Advanced Features

### Conversation Memory Enhancement
- **Pin Key Moments**: Users can bookmark important insights
- **Retrieval System**: "Remember when you liked that reading indicator?"
- **Progress Checkpoints**: Save and restore partial work

### Methodology Transparency
```
Every AI suggestion includes: [ℹ️ Why this?]
Click reveals:
┌─────────────────────────────────────────┐
│ Why I recommended this indicator:        │
│ • Aligns with your "literacy" outcome   │
│ • IRIS+ validated for education sector  │
│ • Cost-effective data collection       │
│ • Used by similar organizations        │
│                                         │
│ Source: IRIS+ ID:3742 | Methodology    │
└─────────────────────────────────────────┘
```

### Future Collaboration Framework
```
Shared Dashboard Roles:
👑 Admin: Full edit + approval rights
✏️ Editor: Can edit theory + indicators  
👀 Reviewer: Comment + suggest only
📊 Viewer: Read-only + export reports
```

## Implementation Roadmap

### Phase 1: Entry Experience (3 weeks)
- Welcome screen with mode selection
- Personality selection for chat users
- Basic mode switching functionality
- Time expectation setting
- Enhanced error handling

### Phase 2: Mode Optimization (5 weeks)
- Full Visual Mode dashboard implementation
- Enhanced chat personalities with consistent language
- Pin/bookmark system for key insights
- Methodology transparency tooltips
- Bulk import/export capabilities

### Phase 3: Advanced Intelligence (7 weeks)
- Behavioral trigger detection and interventions
- Advanced success metric tracking
- Collaboration framework foundation
- Predictive next-action recommendations
- Advanced dashboard analytics

## Technical Considerations

### Performance Requirements
- **Chat Response Time**: <2 seconds for standard queries
- **Dashboard Load Time**: <3 seconds for visual mode initialization
- **Bulk Import**: Support for 1000+ indicators without UI freeze
- **Real-time Sync**: Multi-user collaboration without conflicts

### Accessibility Standards
- **WCAG 2.1 AA Compliance**: Full keyboard navigation, screen reader support
- **Dark Mode**: System preference detection and manual toggle
- **Mobile Responsive**: Touch-optimized interface for tablets/phones
- **Offline Capability**: Basic functionality when connection is poor

### Data Security
- **End-to-End Encryption**: All user data encrypted in transit and at rest
- **Role-Based Access**: Granular permissions for multi-user organizations
- **Audit Logging**: Track all changes for compliance requirements
- **Data Export**: Users own their data with full export capabilities

## Design System Guidelines

### Color Palette
- **Primary Blue**: #2563EB (calls-to-action, progress indicators)
- **Success Green**: #059669 (completed states, positive feedback)
- **Warning Orange**: #D97706 (attention needed, pitfall warnings)
- **Error Red**: #DC2626 (errors, blocking states)
- **Neutral Gray**: #6B7280 (secondary content, disabled states)

### Typography Scale
- **Hero**: 2rem (main headings, welcome messages)
- **Section**: 1.5rem (section titles, mode descriptions)
- **Body**: 1rem (standard content, chat messages)
- **Caption**: 0.875rem (metadata, hints, timestamps)

### Component Standards
- **Button Hierarchy**: Primary, Secondary, Tertiary with consistent styling
- **Form Controls**: Consistent validation states and error messaging
- **Loading States**: Skeleton screens for better perceived performance
- **Empty States**: Helpful, actionable guidance when no data exists

---

*This document serves as the definitive reference for Impact Bot's interface design and should be updated as features evolve and user feedback is incorporated.*