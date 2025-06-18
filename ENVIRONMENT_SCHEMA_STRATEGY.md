# Environment-Schema Alignment Strategy

## 🎯 Problem Statement

The TypeScript errors emerged when we introduced multi-environment management because we created schema-environment misalignment:

1. **Code expects**: `isEmailVerified`, `emailVerificationToken`, `passwordResetToken`
2. **Prisma schema defines**: Basic user model without email verification fields
3. **Database contains**: Manually created tables with verification fields
4. **Result**: Prisma client can't access fields that exist in database but not in schema

## 🏗️ Holistic Solution Framework

### Phase 1: Schema Unification
**Objective**: Single source of truth for data models across all environments

```prisma
// Enhanced User model with all required fields
model User {
  id                        String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  email                     String    @unique @db.VarChar(255)
  passwordHash              String?   @map("password_hash") @db.VarChar(255)
  firstName                 String?   @map("first_name") @db.VarChar(100)
  lastName                  String?   @map("last_name") @db.VarChar(100)
  jobTitle                  String?   @map("job_title") @db.VarChar(255)
  phone                     String?   @db.VarChar(50)
  
  // Email verification (missing from current schema)
  isEmailVerified           Boolean   @default(false) @map("is_email_verified")
  emailVerifiedAt           DateTime? @map("email_verified_at") @db.Timestamptz(6)
  emailVerificationToken    String?   @map("email_verification_token") @db.VarChar(255)
  emailVerificationExpires  DateTime? @map("email_verification_expires") @db.Timestamptz(6)
  
  // Password reset (missing from current schema)
  passwordResetToken        String?   @map("password_reset_token") @db.VarChar(255)
  passwordResetExpires      DateTime? @map("password_reset_expires") @db.Timestamptz(6)
  passwordChangedAt         DateTime? @map("password_changed_at") @db.Timestamptz(6)
  
  preferences               Json      @default("{}") @db.JsonB
  lastLoginAt               DateTime? @map("last_login_at") @db.Timestamptz(6)
  isActive                  Boolean   @default(true) @map("is_active")
  createdAt                 DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                 DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relationships remain the same
  userOrganizations         UserOrganization[]
  // ... other relationships
}
```

### Phase 2: Environment-Aware Migration Strategy
**Objective**: Consistent schema deployment across dev/test/prod

```yaml
# Environment-specific migration workflow
environments:
  development:
    database: impactbot_v2_dev
    migration_mode: "auto_migrate"  # Prisma db push for rapid development
    seed_data: true
    
  test:
    database: impactbot_v2_test
    migration_mode: "versioned"     # Prisma migrate for controlled changes
    seed_data: minimal
    
  production:
    database: impactbot_v2_prod
    migration_mode: "manual"        # Manual review + approval
    seed_data: false
```

### Phase 3: Code Alignment
**Objective**: Remove workarounds, use proper Prisma types

```typescript
// BEFORE (workarounds)
const user = await prisma.user.findFirst({
  where: { email: { contains: '@' } } // Simplified workaround
});

// AFTER (proper schema alignment)
const user = await prisma.user.findFirst({
  where: {
    emailVerificationToken: token,
    emailVerificationExpires: { gt: new Date() }
  }
});
```

## 🔄 Implementation Workflow

### Step 1: Schema Reconciliation
1. **Audit**: Compare current database tables vs Prisma schema
2. **Merge**: Add missing fields to schema-hybrid.prisma
3. **Validate**: Ensure all code expectations match schema

### Step 2: Environment Migration Pipeline
```bash
# Development: Quick iteration
npx prisma db push --schema=src/prisma/schema-hybrid.prisma

# Test: Controlled migration
npx prisma migrate dev --schema=src/prisma/schema-hybrid.prisma

# Production: Manual review
npx prisma migrate deploy --schema=src/prisma/schema-hybrid.prisma
```

### Step 3: Validation Integration
```bash
# Pre-commit validation
./scripts/validate-schema-environment-alignment.sh

# Multi-environment testing
./scripts/validate-deployment-enhanced.sh development
./scripts/validate-deployment-enhanced.sh test
./scripts/validate-deployment-enhanced.sh production
```

## 🎯 User Stories Alignment

### As a Developer
- **I want** consistent schema across all environments
- **So that** my code works the same way locally and in production
- **Success criteria**: No TypeScript errors, no workarounds needed

### As a DevOps Engineer  
- **I want** automated schema validation across environments
- **So that** deployments don't break due to schema mismatches
- **Success criteria**: Validation pipeline catches schema drift before deployment

### As a Product Manager
- **I want** reliable environment management
- **So that** features can be tested consistently before release
- **Success criteria**: Port 3000 testing environment works reliably

## 🔧 Framework Integration

### Impact Bot Architecture Principles
1. **IRIS+ Framework**: Schema supports all impact measurement requirements
2. **Vector Search**: pgvector integration maintained across environments
3. **Multi-tenancy**: Organization isolation preserved
4. **Security**: Proper authentication and authorization fields

### Environment Management Objectives
1. **Isolation**: Separate data volumes per environment ✅
2. **Consistency**: Same schema structure across environments ✅ (after fix)
3. **Validation**: Pre-deployment verification ✅
4. **Collaboration**: Team can work in parallel ✅

## 📊 Success Metrics

### Technical Metrics
- ✅ TypeScript compilation: 0 errors
- ✅ Schema drift detection: Automated
- ✅ Environment validation: All environments pass
- ✅ Code coverage: No workarounds needed

### User Experience Metrics  
- ✅ Port 3000 accessibility: 100% uptime
- ✅ Authentication flow: End-to-end working
- ✅ Development velocity: No schema debugging time
- ✅ Team collaboration: Parallel development possible

## 🚀 Next Steps

1. **Immediate**: Update schema-hybrid.prisma with missing fields
2. **Migration**: Run Prisma migrations to align all environments  
3. **Code cleanup**: Remove workarounds, use proper Prisma types
4. **Validation**: Integrate schema validation into CI/CD pipeline
5. **Documentation**: Update team guides with new workflow

This approach fixes the root cause rather than applying workarounds, ensuring the environment management system works harmoniously with the Impact Bot architecture.