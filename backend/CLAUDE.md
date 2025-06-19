# CLAUDE.md - Project Context

## 🎉 Major Achievement: Zero TypeScript Errors!
Successfully resolved all 232+ TypeScript compilation errors and implemented comprehensive prevention mechanisms.

## Project Vision
An AI-powered impact measurement platform that helps social enterprises measure what matters through:
- Conversation-driven IRIS+ indicator discovery
- Decision mapping methodology to prevent over-engineering
- Theory of change integration
- Custom indicator creation with community validation
- Multi-tenant architecture with organization/team support

## Critical Commands
```bash
# Always run these before committing:
npm run build          # TypeScript compilation check
npm run lint          # ESLint with bulletproof rules
npm run test          # Run all tests including type safety

# Prisma commands:
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:push     # Push schema changes (dev only)
```

## Type Safety Patterns
1. **Authentication**: Always use `getUserContext(req)` helper, never `req.user!`
2. **Optional Properties**: Use conditional spreads `...(value && { field: value })`
3. **Imports**: Use namespace imports for jwt/bcrypt: `import * as jwt from 'jsonwebtoken'`
4. **Null Safety**: Always check database results before using

## Naming Convention Standards (NEW)
### Consistent camelCase with Automatic Transformation
- **API Responses**: Always camelCase (automatically transformed via middleware)
- **Frontend Interfaces**: camelCase TypeScript interfaces
- **Database**: snake_case columns with Prisma @map directives
- **External APIs**: Handled by transformation utilities in `/utils/caseTransform.ts`

### Transformation Utilities
```typescript
import { transformToCamelCase, transformAiResponse } from '@/utils/caseTransform';

// Transform Prisma responses to camelCase
const result = transformToCamelCase(prismaResult);

// Transform AI service responses (handles snake_case fields)
const aiData = transformAiResponse(anthropicResponse);
```

### Response Middleware
All API responses are automatically transformed to camelCase via `/middleware/responseTransform.ts`

## Current Status
- ✅ **EPIC 1**: Foundation Infrastructure COMPLETE (authentication, organization management, RBAC)
- ✅ **EPIC 2**: Multi-tenant platform COMPLETE (member management, role-based access, context switching) 
- ✅ **EPIC 3**: Impact measurement core COMPLETE (AI theory analysis, pitfall prevention, indicator selection)
- ✅ AI-powered theory of change document analysis (80% confidence parsing)
- ✅ Real-time pitfall prevention system with activity vs impact warnings
- ✅ Foundation-first workflow with phase-gated access control
- ✅ Professional UI with 3,342+ lines of frontend components
- ✅ Zero TypeScript errors with prevention framework
- ✅ Naming convention standardization complete (2025-01-19)

## Current Development Phase
**📋 PROJECT 27% COMPLETE - COMPREHENSIVE SCOPE IDENTIFIED**

**Current Focus**: EPIC 4 - Data Collection & Reporting (High Priority)
**Progress**: 18/67 total tasks complete | **Next Due**: 2025-04-13

### Immediate Tasks (Week 1-2)
- [ ] REPORTS-001: Multi-format report generation system (PDF, Excel, dashboards)
- [ ] COLLECTION-001: Data collection planning for custom indicators
- [ ] WORKFLOW-001: Comprehensive data collection workflow setup
- [ ] VALIDATION-001: Data quality and validation setup

### Comprehensive Scope Discovery
Analysis of all planning documents reveals a much larger project scope:
- **95+ detailed user stories** across all role personas
- **AI personality system** (Coach Riley, Advisor Morgan, Analyst Alex)
- **Three interaction modes** (Chat-first, Visual Dashboard, Quick Start)
- **Advanced analytics platform** with cross-organizational learning
- **External integrations** (KoboToolbox, Airtable, Excel, CommCare)
- **Mobile/offline support** with PWA and sync capabilities
- **Multilingual support** and internationalization
- **Production-grade** security, monitoring, and deployment

### Project Tracking
See `/PROJECT_ROADMAP.md` for complete epic tracking (67 total tasks across 7 epics).

## Key Files
- `/docs/TYPE_SAFE_PATTERNS.md` - Comprehensive type safety examples
- `/TYPESCRIPT_CODING_STANDARDS.md` - Coding standards to prevent errors
- `/.eslintrc.bulletproof.js` - Strict linting rules
- `/tests/type-safety.test.ts` - Type safety validation tests

## Database Schema
Using `schema-hybrid.prisma` with pgvector support. Key models:
- User/Organization/Role - Multi-tenant foundation
- DecisionQuestion/DecisionEvolution - Decision mapping
- IrisStrategicGoal/IrisKeyIndicator - IRIS+ taxonomy
- OrganizationTheoryOfChange - Theory integration

## Important Notes
- exactOptionalPropertyTypes: true is enabled - handle optional properties carefully
- All interfaces must be fully implemented (no partial implementations)
- Pre-commit hooks prevent committing TypeScript errors
- CI/CD pipeline enforces 95%+ type coverage