/**
 * Test suite for case transformation utilities
 * Ensures consistent camelCase/snake_case conversion
 */

import { 
  toCamelCase, 
  toSnakeCase, 
  transformToCamelCase, 
  transformToSnakeCase,
  transformAiResponse 
} from '../utils/caseTransform';

describe('Case Transformation Utilities', () => {
  describe('toCamelCase', () => {
    test('converts snake_case to camelCase', () => {
      expect(toCamelCase('target_population')).toBe('targetPopulation');
      expect(toCamelCase('short_term_outcomes')).toBe('shortTermOutcomes');
      expect(toCamelCase('created_at')).toBe('createdAt');
      expect(toCamelCase('simple')).toBe('simple');
    });
  });

  describe('toSnakeCase', () => {
    test('converts camelCase to snake_case', () => {
      expect(toSnakeCase('targetPopulation')).toBe('target_population');
      expect(toSnakeCase('shortTermOutcomes')).toBe('short_term_outcomes');
      expect(toSnakeCase('createdAt')).toBe('created_at');
      expect(toSnakeCase('simple')).toBe('simple');
    });
  });

  describe('transformToCamelCase', () => {
    test('transforms object with snake_case keys to camelCase', () => {
      const input = {
        target_population: 'Rural students',
        short_term_outcomes: ['Improved literacy'],
        created_at: '2025-01-15T10:30:00Z',
        nested_object: {
          external_factors: ['Government policy'],
          problem_definition: 'Educational access'
        }
      };

      const expected = {
        targetPopulation: 'Rural students',
        shortTermOutcomes: ['Improved literacy'],
        createdAt: '2025-01-15T10:30:00Z',
        nestedObject: {
          externalFactors: ['Government policy'],
          problemDefinition: 'Educational access'
        }
      };

      expect(transformToCamelCase(input)).toEqual(expected);
    });

    test('handles arrays correctly', () => {
      const input = [
        { target_population: 'Group A' },
        { target_population: 'Group B' }
      ];

      const expected = [
        { targetPopulation: 'Group A' },
        { targetPopulation: 'Group B' }
      ];

      expect(transformToCamelCase(input)).toEqual(expected);
    });

    test('preserves Date objects', () => {
      const date = new Date();
      const input = { created_at: date };
      const result = transformToCamelCase(input);
      
      expect(result.createdAt).toBe(date);
      expect(result.createdAt instanceof Date).toBe(true);
    });

    test('handles null and undefined values', () => {
      expect(transformToCamelCase(null)).toBe(null);
      expect(transformToCamelCase(undefined)).toBe(undefined);
      expect(transformToCamelCase({ key: null })).toEqual({ key: null });
    });
  });

  describe('transformAiResponse', () => {
    test('transforms AI service response with theory of change structure', () => {
      const aiResponse = {
        extracted: {
          target_population: 'Students in rural areas',
          problem_definition: 'Limited access to quality education',
          short_term_outcomes: ['Increased enrollment'],
          long_term_outcomes: ['Improved graduation rates'],
          external_factors: ['Government funding'],
          intervention_type: 'Educational program',
          geographic_scope: 'Regional'
        },
        confidence: 0.85,
        gaps: ['Need more detail on activities'],
        questions: ['What is the timeline?']
      };

      const result = transformAiResponse(aiResponse);

      expect(result.extracted.targetPopulation).toBe('Students in rural areas');
      expect(result.extracted.problemDefinition).toBe('Limited access to quality education');
      expect(result.extracted.shortTermOutcomes).toEqual(['Increased enrollment']);
      expect(result.extracted.longTermOutcomes).toEqual(['Improved graduation rates']);
      expect(result.extracted.externalFactors).toEqual(['Government funding']);
      expect(result.extracted.interventionType).toBe('Educational program');
      expect(result.extracted.geographicScope).toBe('Regional');
      expect(result.confidence).toBe(0.85);
      expect(result.gaps).toEqual(['Need more detail on activities']);
    });

    test('handles responses without extracted field', () => {
      const aiResponse = {
        confidence: 0.7,
        gaps: [],
        questions: []
      };

      const result = transformAiResponse(aiResponse);
      expect(result.confidence).toBe(0.7);
      expect(result.gaps).toEqual([]);
    });

    test('handles field name fallbacks correctly', () => {
      const aiResponse = {
        extracted: {
          // Mix of snake_case and camelCase to test fallback logic
          target_population: 'Population A',
          problemDefinition: 'Problem B', // Already camelCase
          short_term_outcomes: ['Outcome 1'],
          longTermOutcomes: ['Outcome 2'], // Already camelCase
          impacts: 'Single impact string' // Should be converted to array
        }
      };

      const result = transformAiResponse(aiResponse);
      
      expect(result.extracted.targetPopulation).toBe('Population A');
      expect(result.extracted.problemDefinition).toBe('Problem B');
      expect(result.extracted.shortTermOutcomes).toEqual(['Outcome 1']);
      expect(result.extracted.longTermOutcomes).toEqual(['Outcome 2']);
      expect(result.extracted.impacts).toEqual(['Single impact string']);
    });
  });
});