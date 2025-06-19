# Naming Convention Standards

## Executive Summary
The Impact Bot v2 MVP uses **consistent camelCase with automatic transformation** to provide a seamless developer experience while respecting external system constraints.

## Convention Details

### 1. API Responses → **camelCase**
All API responses are automatically transformed to camelCase via middleware:
```json
{
  "success": true,
  "data": {
    "targetPopulation": "Students in rural communities",
    "shortTermOutcomes": ["Increased literacy rates"],
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### 2. Frontend TypeScript → **camelCase**
All frontend interfaces use camelCase:
```typescript
interface TheoryOfChangeStructure {
  targetPopulation: string;
  problemDefinition: string;
  shortTermOutcomes: string[];
  longTermOutcomes: string[];
  externalFactors: string[];
}
```

### 3. Database Schema → **snake_case**
Database columns use snake_case with Prisma @map directives:
```prisma
model OrganizationTheoryOfChange {
  targetPopulation     String?  @map("target_population")
  shortTermOutcomes    Json     @map("short_term_outcomes")
  createdAt           DateTime @default(now()) @map("created_at")
  
  @@map("organization_theory_of_change")
}
```

### 4. External APIs → **Transformed**
External API responses (like Anthropic Claude) are transformed using utilities:
```typescript
// AI returns: { "target_population": "...", "short_term_outcomes": [...] }
// Transformed to: { "targetPopulation": "...", "shortTermOutcomes": [...] }

const aiResponse = await anthropicAPI.call();
const transformed = transformAiResponse(aiResponse);
```

## Implementation

### Automatic Response Transformation
```typescript
// middleware/responseTransform.ts
export function transformResponse(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json;
  res.json = function(data: any) {
    const transformed = transformToCamelCase(data);
    return originalJson.call(this, transformed);
  };
  next();
}
```

### Utility Functions
```typescript
// utils/caseTransform.ts
export function toCamelCase(str: string): string;
export function toSnakeCase(str: string): string;
export function transformToCamelCase<T>(obj: any): T;
export function transformToSnakeCase<T>(obj: any): T;
export function transformAiResponse(aiData: any): any;
```

### Service Layer Integration
```typescript
// services/theoryOfChangeService.ts
private parseLLMResponse(content: string) {
  const parsed = JSON.parse(content);
  const transformed = transformAiResponse(parsed);
  return {
    extracted: transformed.extracted || {},
    confidence: transformed.confidence || 0.5,
    gaps: transformed.gaps || [],
    questions: transformed.questions || []
  };
}
```

## Benefits

1. **Developer Experience**: Consistent camelCase across frontend and API
2. **Database Compatibility**: snake_case follows PostgreSQL conventions
3. **External System Integration**: Seamless transformation of third-party APIs
4. **Type Safety**: Full TypeScript support with consistent interfaces
5. **Maintainability**: Centralized transformation logic

## Rules for Contributors

### ✅ DO
- Use camelCase for all TypeScript interfaces
- Use snake_case for database column names with @map directives
- Use transformation utilities for external API responses
- Let middleware handle response transformation automatically

### ❌ DON'T
- Mix camelCase and snake_case in the same layer
- Manually transform case in controllers (use utilities)
- Create inconsistent interface definitions
- Bypass the transformation middleware

## File Locations

- **Transformation Utilities**: `/backend/src/utils/caseTransform.ts`
- **Response Middleware**: `/backend/src/middleware/responseTransform.ts`  
- **Database Schema**: `/backend/src/prisma/schema.prisma`
- **Type Definitions**: `/backend/src/types/index.ts`

## Migration Strategy

For existing code that doesn't follow these conventions:

1. **Interfaces**: Update TypeScript interfaces to use camelCase
2. **Database**: Add @map directives for snake_case columns
3. **Services**: Use transformation utilities for external APIs
4. **Controllers**: Remove manual case conversion (handled by middleware)

## Testing

Ensure your code follows naming conventions:
```bash
npm run build          # TypeScript compilation check
npm run lint          # ESLint with naming rules
npm run test          # Run transformation tests
```