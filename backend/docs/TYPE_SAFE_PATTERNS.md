# Type-Safe Patterns Documentation

## Overview
This document provides practical examples and patterns for maintaining type safety in our Express.js + TypeScript + Prisma application. These patterns prevent the 232+ TypeScript errors we successfully eliminated.

## Authentication Patterns

### ✅ Type-Safe Request Authentication

```typescript
// File: /utils/routeHelpers.ts
import type { Request } from 'express';
import { AppError } from '@/utils/errors';
import type { AuthenticatedUser } from '@/types';

export function ensureAuthenticated(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export function getUserContext(req: Request): { organizationId: string; userId: string } {
  const user = ensureAuthenticated(req);
  return {
    organizationId: user.organizationId,
    userId: user.id
  };
}

// Usage in controllers:
export const someController = async (req: Request, res: Response) => {
  const { organizationId, userId } = getUserContext(req);
  // TypeScript knows organizationId and userId are strings
};
```

### ❌ Anti-Pattern: Non-null Assertions
```typescript
// DON'T DO THIS:
const organizationId = req.user!.organizationId; // Unsafe!
const userId = req.user!.id;
```

## Optional Property Patterns

### ✅ Conditional Spread with exactOptionalPropertyTypes

```typescript
// File: Error classes and data construction
export class ValidationError extends AppError {
  field?: string;
  value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    
    // ✅ CORRECT: Conditional assignment
    if (field !== undefined) this.field = field;
    if (value !== undefined) this.value = value;
  }
}

// ✅ CORRECT: Object construction with optional properties
const createErrorData = (message: string, field?: string, context?: any) => ({
  message,
  timestamp: new Date(),
  ...(field && { field }),
  ...(context && { context })
});
```

### ❌ Anti-Pattern: Using || undefined
```typescript
// DON'T DO THIS with exactOptionalPropertyTypes: true
this.field = field || undefined; // TypeScript error!
```

## Prisma Integration Patterns

### ✅ JsonValue Type Handling

```typescript
// File: /middleware/requireAuth.ts
import type { JsonValue } from '@prisma/client/runtime/library';

function convertJsonArrayToStringArray(json: JsonValue): string[] {
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// Usage with Prisma JsonValue fields:
const permissions = convertJsonArrayToStringArray(user.permissions);
```

### ✅ Proper Prisma Model Usage

```typescript
// File: Service methods with proper Prisma types
export class TheoryOfChangeService {
  async updateTheoryOfChange(
    organizationId: string,
    data: Partial<OrganizationTheoryOfChange>
  ): Promise<OrganizationTheoryOfChange> {
    
    const existing = await prisma.organizationTheoryOfChange.findUnique({
      where: { organizationId }
    });

    if (!existing) {
      return await prisma.organizationTheoryOfChange.create({
        data: {
          organizationId,
          ...data
        }
      });
    }

    return await prisma.organizationTheoryOfChange.update({
      where: { organizationId },
      data
    });
  }
}
```

## Namespace Import Patterns

### ✅ Correct Module Imports

```typescript
// File: JWT and bcrypt usage
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

// ✅ CORRECT: Using namespace imports
const token = jwt.sign(payload, secret);
const hashedPassword = await bcrypt.hash(password, 10);
```

### ❌ Anti-Pattern: Default Imports
```typescript
// DON'T DO THIS:
import jwt from 'jsonwebtoken'; // May cause overload issues
import bcrypt from 'bcrypt';
```

## Interface Consistency Patterns

### ✅ Aligned Interface Definitions

```typescript
// File: /types/index.ts
export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  isPrimary: boolean; // Note: NOT optional
  joinedAt: Date;
}

export interface AuthenticatedUser {
  id: string; // Note: 'id' not 'userId'
  email: string;
  organizationId: string;
  role: string;
}

// File: /middleware/requireAuth.ts - MUST align with above
const userOrganizations: UserOrganization[] = organizations.map(org => ({
  id: org.id,
  userId: user.id,
  organizationId: org.id,
  role: org.role,
  isPrimary: org.isPrimary, // Boolean, not optional
  joinedAt: org.joinedAt
}));
```

## Service Implementation Patterns

### ✅ Complete Interface Implementation

```typescript
// File: Service interface
export interface IIrisService {
  getCategories(): Promise<string[]>;
  getThemesByCategory(category: string): Promise<string[]>;
  getStrategicGoals(theme: string): Promise<string[]>;
  getKeyIndicators(options: any): Promise<any>;
  // ... all other methods
}

// File: Service implementation - MUST implement ALL methods
export class IrisService implements IIrisService {
  async getCategories(): Promise<string[]> {
    const categories = await prisma.irisKeyIndicator.findMany({
      select: { category: true },
      distinct: ['category']
    });
    return categories.map(c => c.category);
  }

  async getThemesByCategory(category: string): Promise<string[]> {
    const themes = await prisma.irisKeyIndicator.findMany({
      where: { category },
      select: { theme: true },
      distinct: ['theme']
    });
    return themes.map(t => t.theme);
  }

  // ✅ CRITICAL: Implement EVERY interface method
  async getStrategicGoals(theme: string): Promise<string[]> {
    // Implementation required
  }

  // ... implement ALL other methods
}
```

## Error Handling Patterns

### ✅ Type-Safe Error Construction

```typescript
// File: Custom error classes
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  timestamp: Date;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  field?: string;
  value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    
    // ✅ CORRECT: Conditional assignment for optional properties
    if (field !== undefined) this.field = field;
    if (value !== undefined) this.value = value;
  }
}
```

## Controller Patterns

### ✅ Type-Safe Express Controllers

```typescript
// File: Controller with proper error handling
import type { Request, Response, NextFunction } from 'express';
import { getUserContext } from '@/utils/routeHelpers';

export const createIndicator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ Type-safe authentication
    const { organizationId, userId } = getUserContext(req);
    
    // ✅ Typed request body
    const indicatorData: CreateIndicatorRequest = req.body;
    
    const result = await indicatorService.createCustomIndicator(
      organizationId,
      userId,
      indicatorData
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error); // ✅ Always use next() for error handling
  }
};
```

## Middleware Patterns

### ✅ Type-Safe Middleware

```typescript
// File: Authentication middleware
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return; // ✅ Early return with explicit void
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload;
    
    const user = await getUserWithDetails(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // ✅ Type-safe user assignment
    req.user = createAuthenticatedUser(user, decoded);
    next();
  } catch (error) {
    next(error);
  }
};
```

## Database Query Patterns

### ✅ Null-Safe Database Operations

```typescript
// File: Safe database queries
export class UserService {
  async getUserById(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    // ✅ CRITICAL: Always check for null
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user; // TypeScript knows user is non-null
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<User> {
    // ✅ Check existence before update
    await this.getUserById(userId); // Throws if not found
    
    return await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          upsert: {
            create: preferences,
            update: preferences
          }
        }
      }
    });
  }
}
```

## Validation Patterns

### ✅ Type-Safe Request Validation

```typescript
// File: Validation middleware usage
import { validateRequest, commonSchemas } from '@/middleware/validation';
import Joi from 'joi';

const createIndicatorSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  unit: Joi.string().optional(),
  frequency: commonSchemas.measurementFrequency
});

// ✅ Router with proper validation
router.post('/indicators',
  requireAuth,
  validateRequest(createIndicatorSchema),
  createIndicator
);
```

## Testing Patterns

### ✅ Type-Safe Test Setup

```typescript
// File: Test utilities
interface TestUser {
  id: string;
  email: string;
  organizationId: string;
}

export const createTestUser = async (): Promise<TestUser> => {
  const org = await prisma.organization.create({
    data: {
      name: 'Test Org',
      domain: 'test.com'
    }
  });

  const user = await prisma.user.create({
    data: {
      email: 'test@test.com',
      passwordHash: 'hashed',
      organizations: {
        create: {
          organizationId: org.id,
          role: 'owner',
          isPrimary: true
        }
      }
    }
  });

  return {
    id: user.id,
    email: user.email,
    organizationId: org.id
  };
};
```

## Common Pitfalls and Solutions

### 1. Variable Name Conflicts
```typescript
// ❌ PROBLEM: Multiple getUserContext calls
const { organizationId: orgId1, userId: userId1 } = getUserContext(req);
const { organizationId: orgId2, userId: userId2 } = getUserContext(otherReq);

// ✅ SOLUTION: Use destructuring with aliases
const { organizationId, userId } = getUserContext(req);
```

### 2. Prisma Model Misalignment
```typescript
// ❌ PROBLEM: Using wrong schema
// schema.prisma has different models than schema-hybrid.prisma

// ✅ SOLUTION: Ensure Prisma client regeneration
// npm run prisma:generate
// And verify schema-hybrid.prisma contains all required models
```

### 3. Optional vs Required Properties
```typescript
// ❌ PROBLEM: Inconsistent optional properties
interface UserOrg {
  isPrimary?: boolean; // In one file
}

interface UserOrg {
  isPrimary: boolean; // In another file
}

// ✅ SOLUTION: Align all interface definitions
interface UserOrganization {
  isPrimary: boolean; // Consistent across all files
}
```

## Performance Patterns

### ✅ Efficient Database Queries

```typescript
// File: Optimized queries
export const getIndicatorsWithStats = async (organizationId: string) => {
  return await prisma.customIndicator.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      _count: {
        select: {
          dataPoints: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};
```

These patterns ensure type safety while maintaining code clarity and preventing the TypeScript compilation errors we eliminated. Each pattern has been battle-tested in our codebase's journey from 232+ errors to zero errors.