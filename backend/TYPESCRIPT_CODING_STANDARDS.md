# TypeScript Coding Standards

## Overview
This document establishes bulletproof TypeScript coding standards to prevent the recurrence of compilation errors and maintain high code quality.

## Core Principles

### 1. Strict Type Safety
- **Always use strict TypeScript configuration**
- **Never use `any` type** - use proper typing or `unknown`
- **Avoid non-null assertion (`!`)** - use type guards instead
- **Use conditional property access** for optional properties

### 2. Authentication & Request Handling
```typescript
// ✅ CORRECT: Use helper function for type-safe authentication
import { getUserContext } from '@/utils/routeHelpers';

export const someController = async (req: Request, res: Response) => {
  const { organizationId, userId } = getUserContext(req);
  // ... rest of controller logic
};

// ❌ WRONG: Direct non-null assertion
const organizationId = req.user!.organizationId;
```

### 3. Optional Property Handling
```typescript
// ✅ CORRECT: Conditional assignment with exactOptionalPropertyTypes
const errorData: ErrorData = {
  message: 'Error occurred',
  ...(field && { field }),
  ...(context && { context })
};

// ❌ WRONG: Using || undefined with strict optional properties
this.field = field || undefined; // Breaks with exactOptionalPropertyTypes
```

### 4. Prisma Integration Patterns
```typescript
// ✅ CORRECT: Handle JsonValue properly
function convertJsonArrayToStringArray(json: JsonValue): string[] {
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// ✅ CORRECT: Proper namespace imports
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
```

### 5. Error Handling Standards
```typescript
// ✅ CORRECT: Type-safe error construction
export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    if (field !== undefined) this.field = field;
    if (value !== undefined) this.value = value;
  }
}
```

## Type Definition Patterns

### Interface Consistency
```typescript
// ✅ CORRECT: Align interfaces across files
export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  isPrimary: boolean; // Note: not optional
  joinedAt: Date;
}
```

### Request Type Extensions
```typescript
// ✅ CORRECT: Extend Express types properly
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}
```

## Service Layer Patterns

### Database Operations
```typescript
// ✅ CORRECT: Null-safe database queries
const user = await prisma.user.findUnique({
  where: { id: userId }
});

if (!user) {
  throw new AppError('User not found', 404);
}

// Continue with guaranteed non-null user
```

### Method Implementation
```typescript
// ✅ CORRECT: Implement all interface methods
export class IrisService implements IIrisService {
  async getCategories(): Promise<string[]> {
    return await prisma.irisKeyIndicator.findMany({
      select: { category: true },
      distinct: ['category']
    }).then(results => results.map(r => r.category));
  }
  
  // ... implement ALL interface methods
}
```

## Controller Patterns

### Type-Safe Route Handlers
```typescript
// ✅ CORRECT: Use getUserContext helper
export const updateTheoryOfChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = getUserContext(req);
    const theoryOfChangeData = req.body;
    
    const result = await theoryOfChangeService.updateTheoryOfChange(
      organizationId,
      theoryOfChangeData
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};
```

### Validation Integration
```typescript
// ✅ CORRECT: Use proper validation middleware
import { validateRequest, commonSchemas } from '@/middleware/validation';

router.post('/theory-of-change',
  requireAuth,
  validateRequest(theoryOfChangeSchema),
  updateTheoryOfChange
);
```

## Middleware Patterns

### Authentication Middleware
```typescript
// ✅ CORRECT: Type-safe JWT handling
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    
    const user = await getUserWithOrganizations(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = createAuthenticatedUser(user, decoded);
    next();
  } catch (error) {
    next(error);
  }
};
```

## Error Prevention Checklist

### Before Committing
- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors in IDE
- [ ] All interfaces implemented completely
- [ ] No `any` types used
- [ ] Optional properties handled with conditional spread
- [ ] Authentication uses `getUserContext` helper
- [ ] Prisma JsonValue converted properly
- [ ] Namespace imports used for jwt/bcrypt

### Code Review Focus Areas
1. **Type Safety**: Check for proper typing without `any`
2. **Null Safety**: Verify all optional access is guarded
3. **Interface Completeness**: Ensure all methods implemented
4. **Authentication Pattern**: Consistent use of `getUserContext`
5. **Error Handling**: Proper error types and messages

## Testing Requirements

### Type Safety Tests
```typescript
// Example: Test type safety at compile time
import { AuthenticatedUser } from '@/types';

describe('Type Safety', () => {
  it('should enforce AuthenticatedUser structure', () => {
    const user: AuthenticatedUser = {
      id: 'user-id',
      email: 'test@example.com',
      organizationId: 'org-id',
      role: 'member'
    };
    
    expect(user.id).toBeDefined();
    expect(user.organizationId).toBeDefined();
  });
});
```

## Integration with Tools

### Pre-commit Hooks
```bash
#!/usr/bin/env sh
echo "🔍 Running TypeScript compilation check..."
if ! npm run build >/dev/null 2>&1; then
  echo "❌ TypeScript compilation failed!"
  echo "Fix TypeScript errors before committing."
  exit 1
fi
echo "✅ TypeScript compilation successful"
```

### VS Code Settings
```json
{
  "typescript.preferences.strictNullChecks": true,
  "typescript.preferences.noImplicitAny": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Anti-Patterns to Avoid

### ❌ Common Mistakes
```typescript
// DON'T: Use non-null assertion
const user = req.user!;

// DON'T: Use any type
const data: any = req.body;

// DON'T: Ignore optional property rules
this.field = value || undefined;

// DON'T: Skip interface methods
class Service implements IService {
  // Missing required methods
}
```

### ✅ Correct Alternatives
```typescript
// DO: Use type-safe helpers
const { userId, organizationId } = getUserContext(req);

// DO: Use proper typing
const data: CreateUserRequest = req.body;

// DO: Use conditional assignment
if (value !== undefined) this.field = value;

// DO: Implement all interface methods
class Service implements IService {
  async getAllMethods(): Promise<Result[]> {
    // Implementation for every interface method
  }
}
```

## Enforcement Strategy

1. **Automated Checks**: Pre-commit hooks prevent bad code
2. **Code Review**: Focus on type safety patterns
3. **Documentation**: Keep this guide updated
4. **Training**: Team education on patterns
5. **Monitoring**: Track TypeScript error trends

## Success Metrics

- **Zero TypeScript compilation errors**: Maintained continuously
- **No `any` types**: Enforce through ESLint rules
- **95%+ test coverage**: Include type safety tests
- **Fast CI/CD**: TypeScript checks in under 2 minutes

This document serves as the foundation for maintaining the zero-error TypeScript codebase we've achieved.