/**
 * Case Transformation Utilities
 * Provides consistent data transformation between snake_case (database) and camelCase (API/frontend)
 */

/**
 * Convert snake_case string to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Recursively convert object keys from snake_case to camelCase
 */
export function transformToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformToCamelCase(item)) as T;
  }

  if (obj instanceof Date) {
    return obj as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformToCamelCase(value);
    }
    
    return transformed as T;
  }

  return obj as T;
}

/**
 * Recursively convert object keys from camelCase to snake_case
 */
export function transformToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformToSnakeCase(item)) as T;
  }

  if (obj instanceof Date) {
    return obj as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key);
      transformed[snakeKey] = transformToSnakeCase(value);
    }
    
    return transformed as T;
  }

  return obj as T;
}

/**
 * Transform field names from AI service (snake_case) to frontend format (camelCase)
 * Handles the specific field mappings needed for theory of change data
 */
export function transformAiResponse(aiData: any): any {
  const transformed = transformToCamelCase(aiData);
  
  // Handle specific field mappings for theory of change
  if (transformed.extracted) {
    const extracted = transformed.extracted;
    return {
      ...transformed,
      extracted: {
        targetPopulation: extracted.targetPopulation || extracted.target_population,
        problemDefinition: extracted.problemDefinition || extracted.problem_definition,
        activities: extracted.activities || [],
        outputs: extracted.outputs || [],
        shortTermOutcomes: extracted.shortTermOutcomes || extracted.short_term_outcomes || [],
        longTermOutcomes: extracted.longTermOutcomes || extracted.long_term_outcomes || [],
        impacts: Array.isArray(extracted.impacts) ? extracted.impacts : [extracted.impacts].filter(Boolean),
        assumptions: extracted.assumptions || [],
        externalFactors: extracted.externalFactors || extracted.external_factors || [],
        interventionType: extracted.interventionType || extracted.intervention_type,
        sector: extracted.sector,
        geographicScope: extracted.geographicScope || extracted.geographic_scope
      }
    };
  }
  
  return transformed;
}

/**
 * Type guard to check if a value is a plain object (not Date, Array, etc.)
 */
function isPlainObject(obj: any): obj is Record<string, any> {
  return obj !== null && 
         typeof obj === 'object' && 
         obj.constructor === Object;
}