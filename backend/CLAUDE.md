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

## Current Status
- ✅ Authentication system complete (user registration, login, JWT)
- ✅ Multi-organization support implemented
- ✅ Decision mapping models in place (DecisionQuestion, IndicatorUtility, etc.)
- ✅ Theory of change models ready
- ✅ Zero TypeScript errors with prevention framework

## Next Development Phase
EPIC 2: Multi-Tenant Platform Core
- Organization CRUD operations
- Member invitation system
- Role-based permissions

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