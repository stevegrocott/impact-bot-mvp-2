import { Request, Response } from 'express';
import dataSourceIntegrationService from '../services/dataSourceIntegrationService';
import { transformToCamelCase } from '../utils/caseTransform';

/**
 * Data Source Integration Controller
 * Handles external data source connections, field mapping, and synchronization
 */
class DataSourceIntegrationController {

  /**
   * Get available data source types
   * GET /api/v1/integration/data-source-types
   */
  async getDataSourceTypes(req: Request, res: Response): Promise<void> {
    try {
      const dataSourceTypes = dataSourceIntegrationService.getDataSourceTypes();

      res.json({
        success: true,
        data: {
          dataSourceTypes: transformToCamelCase(dataSourceTypes),
          totalCount: dataSourceTypes.length
        },
        message: `Found ${dataSourceTypes.length} supported data source types`
      });
    } catch (error) {
      console.error('Error fetching data source types:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch data source types',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a new data source
   * POST /api/v1/integration/data-sources
   */
  async createDataSource(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const createdBy = req.user?.id;

      if (!organizationId || !createdBy) {
        res.status(401).json({ success: false, error: 'Organization context and user authentication required' });
        return;
      }

      const { name, type, description, connectionConfig, autoSync, syncFrequency } = req.body;

      if (!name || !type || !connectionConfig) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, type, connectionConfig'
        });
        return;
      }

      const dataSource = await dataSourceIntegrationService.createDataSource(
        organizationId,
        {
          name,
          type,
          description,
          connectionConfig,
          autoSync,
          syncFrequency
        },
        createdBy
      );

      res.status(201).json({
        success: true,
        data: transformToCamelCase(dataSource),
        message: 'Data source created successfully'
      });
    } catch (error) {
      console.error('Error creating data source:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create data source',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test data source connection
   * POST /api/v1/integration/data-sources/test-connection
   */
  async testDataSourceConnection(req: Request, res: Response): Promise<void> {
    try {
      const { type, connectionConfig } = req.body;

      if (!type || !connectionConfig) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: type, connectionConfig'
        });
        return;
      }

      // Create temporary data source object for testing
      const tempDataSource = {
        id: 'temp_test',
        name: 'Test Connection',
        type,
        description: 'Temporary data source for connection testing',
        connectionConfig,
        status: 'pending' as const,
        lastSync: null,
        autoSync: false,
        syncFrequency: 'manual' as const,
        organizationId: req.user?.organizationId || 'temp',
        createdBy: req.user?.id || 'temp',
        fieldMappings: [],
        dataValidation: {
          enableValidation: true,
          stopOnError: false,
          validationRules: [],
          customValidations: []
        },
        syncHistory: []
      };

      const testResult = await dataSourceIntegrationService.testDataSourceConnection(tempDataSource);

      res.json({
        success: true,
        data: transformToCamelCase(testResult),
        message: testResult.success ? 'Connection test successful' : 'Connection test failed'
      });
    } catch (error) {
      console.error('Error testing data source connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test data source connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Configure field mappings for data source
   * POST /api/v1/integration/data-sources/:dataSourceId/field-mappings
   */
  async configureFieldMappings(req: Request, res: Response): Promise<void> {
    try {
      const { dataSourceId } = req.params;
      const { mappings } = req.body;

      if (!dataSourceId) {
        res.status(400).json({ success: false, error: 'Data source ID is required' });
        return;
      }

      if (!mappings || !Array.isArray(mappings)) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: mappings (array)'
        });
        return;
      }

      const fieldMappings = await dataSourceIntegrationService.configureFieldMappings(
        dataSourceId,
        mappings
      );

      res.json({
        success: true,
        data: {
          fieldMappings: transformToCamelCase(fieldMappings),
          totalMappings: fieldMappings.length
        },
        message: `Configured ${fieldMappings.length} field mappings`
      });
    } catch (error) {
      console.error('Error configuring field mappings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to configure field mappings',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get field mapping suggestions
   * POST /api/v1/integration/field-mapping-suggestions
   */
  async getFieldMappingSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { sourceFields, targetSchema } = req.body;

      if (!sourceFields || !Array.isArray(sourceFields)) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: sourceFields (array)'
        });
        return;
      }

      if (!targetSchema || !Array.isArray(targetSchema)) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: targetSchema (array)'
        });
        return;
      }

      const suggestions = await dataSourceIntegrationService.getFieldMappingSuggestions(
        sourceFields,
        targetSchema
      );

      res.json({
        success: true,
        data: {
          suggestions: transformToCamelCase(suggestions),
          totalSuggestions: suggestions.length,
          sourceFieldsCount: sourceFields.length,
          mappedFieldsCount: suggestions.length
        },
        message: `Generated ${suggestions.length} field mapping suggestions`
      });
    } catch (error) {
      console.error('Error generating field mapping suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate field mapping suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Sync data from data source
   * POST /api/v1/integration/data-sources/:dataSourceId/sync
   */
  async syncDataSource(req: Request, res: Response): Promise<void> {
    try {
      const { dataSourceId } = req.params;

      if (!dataSourceId) {
        res.status(400).json({ success: false, error: 'Data source ID is required' });
        return;
      }

      const syncRecord = await dataSourceIntegrationService.syncDataSource(dataSourceId);

      res.json({
        success: true,
        data: transformToCamelCase(syncRecord),
        message: `Data sync ${syncRecord.status}. Processed ${syncRecord.recordsProcessed} records.`
      });
    } catch (error) {
      console.error('Error syncing data source:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync data source',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get sync history for data source
   * GET /api/v1/integration/data-sources/:dataSourceId/sync-history
   */
  async getSyncHistory(req: Request, res: Response): Promise<void> {
    try {
      const { dataSourceId } = req.params;
      const { limit } = req.query;

      if (!dataSourceId) {
        res.status(400).json({ success: false, error: 'Data source ID is required' });
        return;
      }

      const syncHistory = await dataSourceIntegrationService.getSyncHistory(
        dataSourceId,
        limit ? parseInt(limit as string) : 50
      );

      res.json({
        success: true,
        data: {
          syncHistory: transformToCamelCase(syncHistory),
          totalRecords: syncHistory.length
        },
        message: `Found ${syncHistory.length} sync records`
      });
    } catch (error) {
      console.error('Error fetching sync history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sync history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get data integration analytics
   * GET /api/v1/integration/analytics
   */
  async getIntegrationAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const analytics = await dataSourceIntegrationService.getIntegrationAnalytics(organizationId);

      res.json({
        success: true,
        data: transformToCamelCase(analytics),
        message: 'Integration analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching integration analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch integration analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get data source configuration templates
   * GET /api/v1/integration/config-templates/:type
   */
  async getConfigurationTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      if (!type) {
        res.status(400).json({ success: false, error: 'Data source type is required' });
        return;
      }

      // Generate configuration template based on data source type
      const templates: Record<string, any> = {
        kobo_toolbox: {
          koboServer: {
            type: 'string',
            required: true,
            description: 'KoboToolbox server URL (e.g., https://kf.kobotoolbox.org)',
            example: 'https://kf.kobotoolbox.org'
          },
          koboUsername: {
            type: 'string',
            required: true,
            description: 'Your KoboToolbox username',
            sensitive: true
          },
          koboPassword: {
            type: 'string',
            required: true,
            description: 'Your KoboToolbox password',
            sensitive: true
          },
          koboFormId: {
            type: 'string',
            required: true,
            description: 'The specific form ID to sync data from',
            example: 'aXYZ123'
          }
        },
        airtable: {
          airtableApiKey: {
            type: 'string',
            required: true,
            description: 'Your Airtable API key',
            sensitive: true
          },
          airtableBaseId: {
            type: 'string',
            required: true,
            description: 'The Airtable base ID',
            example: 'appXYZ123'
          },
          airtableTableName: {
            type: 'string',
            required: true,
            description: 'The table name within the base',
            example: 'Impact Data'
          }
        },
        google_sheets: {
          googleSheetId: {
            type: 'string',
            required: true,
            description: 'Google Sheets document ID from the URL',
            example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
          },
          googleServiceAccountKey: {
            type: 'object',
            required: true,
            description: 'Service account JSON key file content',
            sensitive: true
          },
          googleSheetRange: {
            type: 'string',
            required: false,
            description: 'Optional range specification (e.g., A1:Z1000)',
            example: 'Sheet1!A1:Z1000'
          }
        },
        excel: {
          filePath: {
            type: 'string',
            required: true,
            description: 'Path to the Excel file'
          },
          sheetName: {
            type: 'string',
            required: false,
            description: 'Specific sheet name (defaults to first sheet)'
          },
          headerRow: {
            type: 'number',
            required: false,
            description: 'Row number containing headers (defaults to 1)',
            example: 1
          }
        },
        commcare: {
          commcareApiKey: {
            type: 'string',
            required: true,
            description: 'CommCare API key',
            sensitive: true
          },
          comcareUsername: {
            type: 'string',
            required: true,
            description: 'CommCare username',
            sensitive: true
          },
          commcarePassword: {
            type: 'string',
            required: true,
            description: 'CommCare password',
            sensitive: true
          },
          commcareDomain: {
            type: 'string',
            required: true,
            description: 'CommCare project domain',
            example: 'your-project'
          },
          commcareFormId: {
            type: 'string',
            required: false,
            description: 'Specific form ID (optional)',
            example: 'form-xyz'
          }
        },
        api: {
          apiEndpoint: {
            type: 'string',
            required: true,
            description: 'API endpoint URL',
            example: 'https://api.example.com/data'
          },
          apiKey: {
            type: 'string',
            required: false,
            description: 'API key for authentication',
            sensitive: true
          },
          apiHeaders: {
            type: 'object',
            required: false,
            description: 'Additional headers for API requests',
            example: { 'Content-Type': 'application/json' }
          },
          apiMethod: {
            type: 'string',
            required: false,
            description: 'HTTP method (GET or POST)',
            example: 'GET',
            allowedValues: ['GET', 'POST']
          }
        }
      };

      const template = templates[type];

      if (!template) {
        res.status(404).json({
          success: false,
          error: `Configuration template not found for type: ${type}`
        });
        return;
      }

      res.json({
        success: true,
        data: {
          type,
          template: transformToCamelCase(template),
          requiredFields: Object.entries(template)
            .filter(([_, config]: [string, any]) => config.required)
            .map(([field]) => field),
          optionalFields: Object.entries(template)
            .filter(([_, config]: [string, any]) => !config.required)
            .map(([field]) => field)
        },
        message: `Configuration template for ${type} retrieved successfully`
      });
    } catch (error) {
      console.error('Error fetching configuration template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch configuration template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate data source configuration
   * POST /api/v1/integration/validate-config
   */
  async validateDataSourceConfig(req: Request, res: Response): Promise<void> {
    try {
      const { type, connectionConfig } = req.body;

      if (!type || !connectionConfig) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: type, connectionConfig'
        });
        return;
      }

      const dataSourceTypes = dataSourceIntegrationService.getDataSourceTypes();
      const dataSourceType = dataSourceTypes.find(t => t.type === type);

      if (!dataSourceType) {
        res.status(400).json({
          success: false,
          error: `Unsupported data source type: ${type}`
        });
        return;
      }

      // Validate required fields
      const validationResults = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[],
        missingRequired: [] as string[],
        extraFields: [] as string[]
      };

      // Check required fields
      for (const requiredField of dataSourceType.configFields) {
        if (!connectionConfig[requiredField]) {
          validationResults.missingRequired.push(requiredField);
          validationResults.valid = false;
        }
      }

      // Check for extra fields
      for (const providedField of Object.keys(connectionConfig)) {
        if (!dataSourceType.configFields.includes(providedField)) {
          validationResults.extraFields.push(providedField);
          validationResults.warnings.push(`Unexpected field: ${providedField}`);
        }
      }

      // Add specific validation errors
      if (validationResults.missingRequired.length > 0) {
        validationResults.errors.push(`Missing required fields: ${validationResults.missingRequired.join(', ')}`);
      }

      res.json({
        success: true,
        data: {
          validation: transformToCamelCase(validationResults),
          dataSourceType: transformToCamelCase(dataSourceType)
        },
        message: validationResults.valid ? 'Configuration is valid' : 'Configuration validation failed'
      });
    } catch (error) {
      console.error('Error validating data source configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new DataSourceIntegrationController();