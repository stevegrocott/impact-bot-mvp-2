/**
 * Application Layer Integration Testing Framework
 * Tests all services and layers that the frontend depends on
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

// Test data setup
const testUser = {
  email: 'test@frontend-integration.com',
  password: 'TestPassword123!',
  firstName: 'Frontend',
  lastName: 'Tester'
};

const testOrganization = {
  name: 'Frontend Integration Test Org',
  description: 'Test organization for frontend integration testing'
};

let authToken: string;
let organizationId: string;
let userId: string;

describe('🧪 Application Layer Integration Tests', () => {
  
  beforeAll(async () => {
    // Setup test database and authentication
    await setupTestEnvironment();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestEnvironment();
    await prisma.$disconnect();
  });

  describe('🔐 Authentication Layer', () => {
    
    test('Should register user and organization', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          organizationName: testOrganization.name,
          organizationDescription: testOrganization.description
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.organization.name).toBe(testOrganization.name);
      
      // Store for subsequent tests
      authToken = response.body.data.token;
      organizationId = response.body.data.organization.id;
      userId = response.body.data.user.id;
    });

    test('Should authenticate user login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('Should validate protected routes require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/organizations/current')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should access protected routes with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/organizations/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organization.id).toBe(organizationId);
    });
  });

  describe('🏢 Organization Management Layer', () => {
    
    test('Should get current organization details', async () => {
      const response = await request(app)
        .get('/api/v1/organizations/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.organization.name).toBe(testOrganization.name);
      expect(response.body.data.memberCount).toBeGreaterThan(0);
    });

    test('Should update organization settings', async () => {
      const updates = {
        description: 'Updated test organization description',
        industry: 'Technology'
      };

      const response = await request(app)
        .put('/api/v1/organizations/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.description).toBe(updates.description);
      expect(response.body.data.industry).toBe(updates.industry);
    });

    test('Should manage organization members', async () => {
      // Get members list
      const membersResponse = await request(app)
        .get('/api/v1/organizations/current/members')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(membersResponse.body.data.members).toHaveLength(1);
      expect(membersResponse.body.data.members[0].user.email).toBe(testUser.email);
    });
  });

  describe('🎯 Foundation & Theory of Change Layer', () => {
    
    test('Should get foundation readiness assessment', async () => {
      const response = await request(app)
        .get('/api/v1/foundation/readiness')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.readinessScore).toBeDefined();
      expect(response.body.data.phase).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });

    test('Should update theory of change', async () => {
      const theoryData = {
        vision: 'Test vision for frontend integration',
        mission: 'Test mission statement',
        targetPopulation: 'Frontend test users',
        outcomes: [
          {
            title: 'Improved user experience',
            description: 'Users can effectively interact with the platform',
            indicators: ['user_satisfaction', 'task_completion_rate']
          }
        ]
      };

      const response = await request(app)
        .put('/api/v1/theory-of-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send(theoryData)
        .expect(200);

      expect(response.body.data.vision).toBe(theoryData.vision);
      expect(response.body.data.outcomes).toHaveLength(1);
    });

    test('Should get theory of change validation', async () => {
      const response = await request(app)
        .post('/api/v1/theory-of-change/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.validationScore).toBeDefined();
      expect(response.body.data.completeness).toBeDefined();
      expect(response.body.data.gaps).toBeDefined();
    });
  });

  describe('📊 Indicator Management Layer', () => {
    
    test('Should search IRIS+ indicators', async () => {
      const response = await request(app)
        .get('/api/v1/iris/indicators?search=education&category=human_capital')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.indicators).toBeDefined();
      expect(Array.isArray(response.body.data.indicators)).toBe(true);
    });

    test('Should get indicator categories', async () => {
      const response = await request(app)
        .get('/api/v1/iris/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.categories).toBeDefined();
      expect(response.body.data.categories.length).toBeGreaterThan(0);
    });

    test('Should create custom indicator', async () => {
      const indicatorData = {
        name: 'Frontend Test Indicator',
        description: 'Custom indicator for testing frontend integration',
        category: 'custom',
        unit: 'percentage',
        frequency: 'monthly',
        targetValue: 85
      };

      const response = await request(app)
        .post('/api/v1/indicators/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send(indicatorData)
        .expect(201);

      expect(response.body.data.name).toBe(indicatorData.name);
      expect(response.body.data.organizationId).toBe(organizationId);
    });
  });

  describe('⚠️ Pitfall Prevention Layer', () => {
    
    test('Should get real-time warnings', async () => {
      const response = await request(app)
        .get('/api/v1/warnings/real-time')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.warnings).toBeDefined();
      expect(response.body.data.foundationStatus).toBeDefined();
    });

    test('Should check for pitfall detection', async () => {
      const testData = {
        indicators: [
          { name: 'Number of workshops conducted', type: 'output' },
          { name: 'Attendance rate', type: 'output' }
        ]
      };

      const response = await request(app)
        .post('/api/v1/pitfall-detection/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(200);

      expect(response.body.data.warnings).toBeDefined();
      expect(response.body.data.riskLevel).toBeDefined();
    });
  });

  describe('📈 Data Collection & Workflow Layer', () => {
    
    test('Should get data collection workflows', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.workflows).toBeDefined();
      expect(response.body.data.totalCount).toBeDefined();
    });

    test('Should create data collection workflow', async () => {
      const workflowData = {
        name: 'Frontend Test Workflow',
        description: 'Test workflow for frontend integration',
        frequency: 'monthly',
        dataPoints: ['satisfaction_score', 'completion_rate'],
        assignedTo: [userId]
      };

      const response = await request(app)
        .post('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData)
        .expect(201);

      expect(response.body.data.name).toBe(workflowData.name);
    });

    test('Should validate data quality', async () => {
      const testData = {
        data: [
          { indicator: 'satisfaction_score', value: 4.5, date: new Date().toISOString() },
          { indicator: 'completion_rate', value: 89, date: new Date().toISOString() }
        ]
      };

      const response = await request(app)
        .post('/api/v1/validation/validate-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(200);

      expect(response.body.data.validationResults).toBeDefined();
      expect(response.body.data.qualityScore).toBeDefined();
    });
  });

  describe('📋 Reporting & Analytics Layer', () => {
    
    test('Should generate stakeholder reports', async () => {
      const reportConfig = {
        stakeholderId: 'test_stakeholder',
        reportType: 'progress',
        reportingPeriod: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/v1/stakeholder-reporting/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportConfig)
        .expect(201);

      expect(response.body.data.title).toBeDefined();
      expect(response.body.data.content).toBeDefined();
    });

    test('Should get report templates', async () => {
      const response = await request(app)
        .get('/api/v1/stakeholder-reporting/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.templates).toBeDefined();
      expect(response.body.data.totalCount).toBeGreaterThan(0);
    });
  });

  describe('🤖 AI Personality Layer', () => {
    
    test('Should get available AI personalities', async () => {
      const response = await request(app)
        .get('/api/v1/ai-personalities/personalities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.personalities).toBeDefined();
      expect(response.body.data.personalities.length).toBe(3); // Coach Riley, Advisor Morgan, Analyst Alex
    });

    test('Should select personality for context', async () => {
      const contextData = {
        userRole: 'impact_analyst',
        currentPhase: 'foundation',
        foundationReadiness: 45,
        currentTask: 'theory_development'
      };

      const response = await request(app)
        .post('/api/v1/ai-personalities/select-personality')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contextData)
        .expect(200);

      expect(response.body.data.selectedPersonality).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThan(0);
    });

    test('Should generate personality response', async () => {
      const requestData = {
        personalityId: 'coach_riley',
        userMessage: 'I need help with my theory of change',
        context: {
          userId: userId,
          organizationId: organizationId,
          userRole: 'impact_analyst',
          currentPhase: 'foundation',
          foundationReadiness: 45
        }
      };

      const response = await request(app)
        .post('/api/v1/ai-personalities/generate-response')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      expect(response.body.data.response).toBeDefined();
      expect(response.body.data.personalityName).toBe('Coach Riley');
    });
  });

  describe('🧠 Cross-Org Learning Layer', () => {
    
    test('Should get learning insights', async () => {
      const response = await request(app)
        .get('/api/v1/cross-org-learning/insights?sector=education')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.insights).toBeDefined();
      expect(response.body.data.totalInsights).toBeGreaterThan(0);
    });

    test('Should get benchmarking data', async () => {
      const response = await request(app)
        .get('/api/v1/cross-org-learning/benchmarks?metrics=foundation_readiness,stakeholder_satisfaction')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.benchmarks).toBeDefined();
      expect(response.body.data.benchmarkSummary).toBeDefined();
    });

    test('Should get personalized recommendations', async () => {
      const contextData = {
        foundationReadiness: 45,
        currentPhase: 'foundation',
        teamExperience: 'intermediate',
        resourceLevel: 'medium',
        priorities: ['foundation_building', 'stakeholder_engagement']
      };

      const response = await request(app)
        .post('/api/v1/cross-org-learning/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contextData)
        .expect(200);

      expect(response.body.data.recommendations).toBeDefined();
    });
  });

  describe('📚 Knowledge Sharing Layer', () => {
    
    test('Should search knowledge base', async () => {
      const response = await request(app)
        .get('/api/v1/knowledge-sharing/search?q=stakeholder engagement&category=methodology')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.results).toBeDefined();
      expect(response.body.data.searchMetadata).toBeDefined();
    });

    test('Should get best practices', async () => {
      const response = await request(app)
        .get('/api/v1/knowledge-sharing/best-practices?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.practices).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    test('Should get trending content', async () => {
      const response = await request(app)
        .get('/api/v1/knowledge-sharing/trending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.trendingPractices).toBeDefined();
      expect(response.body.data.hotTopics).toBeDefined();
    });
  });

  describe('🔗 External Integration Layer', () => {
    
    test('Should get data source configurations', async () => {
      const response = await request(app)
        .get('/api/v1/integration/data-sources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.dataSources).toBeDefined();
      expect(response.body.data.supportedTypes).toBeDefined();
    });

    test('Should test data source connection', async () => {
      const connectionData = {
        type: 'csv_upload',
        name: 'Test CSV Source',
        config: {
          delimiter: ',',
          hasHeader: true
        }
      };

      const response = await request(app)
        .post('/api/v1/integration/data-sources/test-connection')
        .set('Authorization', `Bearer ${authToken}`)
        .send(connectionData)
        .expect(200);

      expect(response.body.data.connectionStatus).toBeDefined();
    });
  });

  describe('🎨 UX/UI Support Layer', () => {
    
    test('Should get user behavior analytics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/user-behavior')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.foundationPathwayMetrics).toBeDefined();
      expect(response.body.data.pitfallPreventionMetrics).toBeDefined();
    });

    test('Should track user interaction', async () => {
      const interactionData = {
        eventType: 'foundation_assessment_started',
        eventData: {
          phase: 'theory_development',
          timeSpent: 120
        }
      };

      const response = await request(app)
        .post('/api/v1/analytics/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

// Helper functions
async function setupTestEnvironment() {
  // Clean up any existing test data
  await prisma.user.deleteMany({
    where: { email: { contains: 'frontend-integration' } }
  });
  
  console.log('🧪 Test environment setup complete');
}

async function cleanupTestEnvironment() {
  // Clean up test data
  if (organizationId) {
    await prisma.user.deleteMany({
      where: { organizationId }
    });
    
    await prisma.organization.deleteMany({
      where: { id: organizationId }
    });
  }
  
  console.log('🧹 Test environment cleanup complete');
}