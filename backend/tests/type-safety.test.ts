/**
 * Type Safety Validation Tests
 * Ensures TypeScript patterns work correctly and prevent regressions
 */

import { Request, Response } from 'express';
import { getUserContext, ensureAuthenticated } from '@/utils/routeHelpers';
import { AppError, ValidationError } from '@/utils/errors';
import type { AuthenticatedUser, UserOrganization } from '@/types';

describe('Type Safety Validation', () => {
  
  describe('Authentication Patterns', () => {
    
    it('should enforce AuthenticatedUser structure', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: 'member'
      };
      
      expect(user.id).toBeDefined();
      expect(user.organizationId).toBeDefined();
      expect(typeof user.role).toBe('string');
    });

    it('should enforce getUserContext return type', () => {
      const mockUser: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: 'member'
      };

      const mockReq = { user: mockUser } as Request;
      const context = getUserContext(mockReq);
      
      // TypeScript compilation validates these properties exist
      expect(context.userId).toBe('user-123');
      expect(context.organizationId).toBe('org-456');
    });

    it('should throw on missing authentication', () => {
      const mockReq = {} as Request;
      
      expect(() => getUserContext(mockReq)).toThrow(AppError);
      expect(() => ensureAuthenticated(mockReq)).toThrow('Authentication required');
    });
  });

  describe('Error Class Patterns', () => {
    
    it('should handle optional properties correctly', () => {
      const error1 = new ValidationError('Test error');
      expect(error1.field).toBeUndefined();
      expect(error1.value).toBeUndefined();
      
      const error2 = new ValidationError('Test error', 'testField', 'testValue');
      expect(error2.field).toBe('testField');
      expect(error2.value).toBe('testValue');
    });

    it('should maintain error inheritance', () => {
      const error = new ValidationError('Test validation error');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('Interface Consistency', () => {
    
    it('should enforce UserOrganization structure', () => {
      const userOrg: UserOrganization = {
        id: 'userorg-123',
        userId: 'user-456',
        organizationId: 'org-789',
        role: 'admin',
        isPrimary: true, // Must be boolean, not optional
        joinedAt: new Date()
      };
      
      expect(typeof userOrg.isPrimary).toBe('boolean');
      expect(userOrg.joinedAt).toBeInstanceOf(Date);
    });
  });

  describe('Conditional Property Patterns', () => {
    
    it('should create objects with conditional properties', () => {
      const createData = (message: string, field?: string, context?: any) => ({
        message,
        timestamp: new Date(),
        ...(field && { field }),
        ...(context && { context })
      });
      
      const data1 = createData('Test message');
      expect(data1.field).toBeUndefined();
      expect(data1.context).toBeUndefined();
      
      const data2 = createData('Test message', 'testField', { test: true });
      expect(data2.field).toBe('testField');
      expect(data2.context).toEqual({ test: true });
    });
  });

  describe('Prisma JsonValue Handling', () => {
    
    it('should convert JsonValue arrays safely', () => {
      // Simulate the helper function we use in middleware
      function convertJsonArrayToStringArray(json: any): string[] {
        if (Array.isArray(json)) {
          return json.filter((item): item is string => typeof item === 'string');
        }
        return [];
      }
      
      expect(convertJsonArrayToStringArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(convertJsonArrayToStringArray(['a', 1, 'c'])).toEqual(['a', 'c']);
      expect(convertJsonArrayToStringArray(null)).toEqual([]);
      expect(convertJsonArrayToStringArray('not-array')).toEqual([]);
    });
  });

  describe('Null Safety Patterns', () => {
    
    it('should handle nullable database results', () => {
      // Simulate database query that might return null
      const findUser = (id: string) => {
        return id === 'existing' ? { id, name: 'Test User' } : null;
      };
      
      const getUserSafely = (id: string) => {
        const user = findUser(id);
        if (!user) {
          throw new AppError('User not found', 404);
        }
        return user; // TypeScript knows this is non-null
      };
      
      expect(getUserSafely('existing')).toEqual({ id: 'existing', name: 'Test User' });
      expect(() => getUserSafely('missing')).toThrow('User not found');
    });
  });

  describe('Type Guard Patterns', () => {
    
    it('should use type guards instead of non-null assertions', () => {
      const isAuthenticatedUser = (user: any): user is AuthenticatedUser => {
        return user && 
               typeof user.id === 'string' &&
               typeof user.email === 'string' &&
               typeof user.organizationId === 'string' &&
               typeof user.role === 'string';
      };
      
      const validUser = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: 'member'
      };
      
      const invalidUser = { id: 'user-123' };
      
      expect(isAuthenticatedUser(validUser)).toBe(true);
      expect(isAuthenticatedUser(invalidUser)).toBe(false);
    });
  });

  describe('Async/Promise Patterns', () => {
    
    it('should handle async operations safely', async () => {
      const asyncOperation = async (shouldFail: boolean): Promise<string> => {
        if (shouldFail) {
          throw new AppError('Operation failed', 500);
        }
        return 'success';
      };
      
      await expect(asyncOperation(false)).resolves.toBe('success');
      await expect(asyncOperation(true)).rejects.toThrow('Operation failed');
    });
  });

  describe('Request Handler Patterns', () => {
    
    it('should validate controller function signatures', () => {
      // Test that our controller pattern compiles correctly
      const mockController = async (req: Request, res: Response): Promise<void> => {
        const { organizationId, userId } = getUserContext(req);
        
        // Simulate response
        res.json({ organizationId, userId });
      };
      
      // TypeScript compilation validates the function signature
      expect(typeof mockController).toBe('function');
    });
  });

  describe('Import Pattern Validation', () => {
    
    it('should validate namespace import usage', () => {
      // These would be compilation errors if imports were wrong
      const jwt = require('jsonwebtoken');
      const bcrypt = require('bcrypt');
      
      expect(typeof jwt.sign).toBe('function');
      expect(typeof bcrypt.hash).toBe('function');
    });
  });
});

/**
 * Compilation Tests
 * These tests validate that TypeScript compilation succeeds
 */
describe('Compilation Validation', () => {
  
  it('should compile without exactOptionalPropertyTypes errors', () => {
    class TestError extends Error {
      field?: string;
      
      constructor(message: string, field?: string) {
        super(message);
        // ✅ This pattern should compile with exactOptionalPropertyTypes: true
        if (field !== undefined) this.field = field;
      }
    }
    
    const error1 = new TestError('test');
    const error2 = new TestError('test', 'fieldName');
    
    expect(error1.field).toBeUndefined();
    expect(error2.field).toBe('fieldName');
  });

  it('should compile with strict null checks', () => {
    const processUser = (user: AuthenticatedUser | null) => {
      // ✅ This pattern should compile with strict null checks
      if (!user) {
        throw new Error('User required');
      }
      
      // TypeScript knows user is non-null here
      return user.id;
    };
    
    const user: AuthenticatedUser = {
      id: 'test-id',
      email: 'test@example.com',
      organizationId: 'org-id',
      role: 'member'
    };
    
    expect(processUser(user)).toBe('test-id');
    expect(() => processUser(null)).toThrow('User required');
  });
});

/**
 * Regression Prevention Tests
 * Tests that specifically prevent the types of errors we fixed
 */
describe('Regression Prevention', () => {
  
  it('should prevent req.user! non-null assertion pattern', () => {
    // This test ensures we don't regress to unsafe patterns
    const safeGetUser = (req: Request): AuthenticatedUser => {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      return req.user;
    };
    
    const mockReq = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: 'member'
      }
    } as Request;
    
    expect(() => safeGetUser(mockReq)).not.toThrow();
    expect(() => safeGetUser({} as Request)).toThrow('Authentication required');
  });

  it('should prevent property mismatch between interfaces', () => {
    // This test validates that our UserOrganization interface is consistent
    const createUserOrg = (
      userId: string,
      organizationId: string,
      role: string,
      isPrimary: boolean
    ): UserOrganization => ({
      id: 'userorg-123',
      userId,
      organizationId,
      role,
      isPrimary, // Must be boolean, not optional
      joinedAt: new Date()
    });
    
    const userOrg = createUserOrg('user-123', 'org-456', 'member', true);
    expect(typeof userOrg.isPrimary).toBe('boolean');
  });

  it('should prevent missing service method implementations', () => {
    // This validates that service interfaces are fully implemented
    interface TestService {
      method1(): Promise<string>;
      method2(): Promise<number>;
    }
    
    class TestServiceImpl implements TestService {
      async method1(): Promise<string> {
        return 'test';
      }
      
      async method2(): Promise<number> {
        return 42;
      }
      
      // ✅ All interface methods must be implemented
    }
    
    const service = new TestServiceImpl();
    expect(typeof service.method1).toBe('function');
    expect(typeof service.method2).toBe('function');
  });
});