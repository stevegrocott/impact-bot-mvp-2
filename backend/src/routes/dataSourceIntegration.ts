import { Router } from 'express';
import dataSourceIntegrationController from '../controllers/dataSourceIntegrationController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all integration routes
router.use(authMiddleware);

/**
 * Data Source Type & Configuration Routes
 */

// Get available data source types
// GET /api/v1/integration/data-source-types
router.get('/data-source-types', dataSourceIntegrationController.getDataSourceTypes);

// Get configuration template for data source type
// GET /api/v1/integration/config-templates/:type
router.get('/config-templates/:type', dataSourceIntegrationController.getConfigurationTemplate);

// Validate data source configuration
// POST /api/v1/integration/validate-config
router.post('/validate-config', dataSourceIntegrationController.validateDataSourceConfig);

/**
 * Data Source Management Routes
 */

// Create a new data source
// POST /api/v1/integration/data-sources
// Requires: impact_analyst, impact_manager, org_admin
router.post('/data-sources', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataSourceIntegrationController.createDataSource
);

// Test data source connection
// POST /api/v1/integration/data-sources/test-connection
// Requires: impact_analyst, impact_manager, org_admin
router.post('/data-sources/test-connection', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataSourceIntegrationController.testDataSourceConnection
);

/**
 * Field Mapping Routes
 */

// Configure field mappings for data source
// POST /api/v1/integration/data-sources/:dataSourceId/field-mappings
// Requires: impact_analyst, impact_manager, org_admin
router.post('/data-sources/:dataSourceId/field-mappings', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataSourceIntegrationController.configureFieldMappings
);

// Get field mapping suggestions
// POST /api/v1/integration/field-mapping-suggestions
// Requires: impact_analyst, impact_manager, org_admin
router.post('/field-mapping-suggestions', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataSourceIntegrationController.getFieldMappingSuggestions
);

/**
 * Data Synchronization Routes
 */

// Sync data from data source
// POST /api/v1/integration/data-sources/:dataSourceId/sync
// Requires: impact_analyst, impact_manager, org_admin
router.post('/data-sources/:dataSourceId/sync', 
  requireRole(['impact_analyst', 'impact_manager', 'org_admin']),
  dataSourceIntegrationController.syncDataSource
);

// Get sync history for data source
// GET /api/v1/integration/data-sources/:dataSourceId/sync-history
router.get('/data-sources/:dataSourceId/sync-history', 
  dataSourceIntegrationController.getSyncHistory
);

/**
 * Analytics & Monitoring Routes
 */

// Get data integration analytics
// GET /api/v1/integration/analytics
// Requires: impact_manager, org_admin
router.get('/analytics', 
  requireRole(['impact_manager', 'org_admin']),
  dataSourceIntegrationController.getIntegrationAnalytics
);

export default router;