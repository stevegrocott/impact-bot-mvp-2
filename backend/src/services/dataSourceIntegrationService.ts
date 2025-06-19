import { PrismaClient } from '@prisma/client';
import { transformToCamelCase, transformToSnakeCase } from '../utils/caseTransform';

const prisma = new PrismaClient();

export interface DataSource {
  id: string;
  name: string;
  type: 'kobo_toolbox' | 'airtable' | 'excel' | 'google_sheets' | 'commcare' | 'survey_monkey' | 'csv_upload' | 'api' | 'database';
  description: string;
  connectionConfig: DataSourceConfig;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: Date | null;
  autoSync: boolean;
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  organizationId: string;
  createdBy: string;
  fieldMappings: FieldMapping[];
  dataValidation: ValidationConfig;
  syncHistory: SyncRecord[];
}

export interface DataSourceConfig {
  // KoboToolbox configuration
  koboServer?: string;
  koboUsername?: string;
  koboPassword?: string;
  koboFormId?: string;
  
  // Airtable configuration
  airtableApiKey?: string;
  airtableBaseId?: string;
  airtableTableName?: string;
  
  // Google Sheets configuration
  googleSheetId?: string;
  googleServiceAccountKey?: any;
  googleSheetRange?: string;
  
  // CommCare configuration
  commcareApiKey?: string;
  comcareUsername?: string;
  commcarePassword?: string;
  commcareDomain?: string;
  commcareFormId?: string;
  
  // Excel/CSV configuration
  filePath?: string;
  sheetName?: string;
  headerRow?: number;
  
  // API configuration
  apiEndpoint?: string;
  apiKey?: string;
  apiHeaders?: Record<string, string>;
  apiMethod?: 'GET' | 'POST';
  
  // Database configuration
  databaseHost?: string;
  databasePort?: number;
  databaseName?: string;
  databaseUsername?: string;
  databasePassword?: string;
  databaseQuery?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
  transformation?: FieldTransformation;
  validation?: FieldValidation;
}

export interface FieldTransformation {
  type: 'direct' | 'formula' | 'lookup' | 'concatenation' | 'split' | 'date_format' | 'number_format';
  parameters: Record<string, any>;
  formula?: string;
  lookupTable?: Record<string, any>;
}

export interface FieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
}

export interface ValidationConfig {
  enableValidation: boolean;
  stopOnError: boolean;
  validationRules: string[];
  customValidations: CustomValidation[];
}

export interface CustomValidation {
  name: string;
  description: string;
  rule: string;
  errorMessage: string;
  severity: 'error' | 'warning';
}

export interface SyncRecord {
  id: string;
  dataSourceId: string;
  startedAt: Date;
  completedAt: Date | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: SyncError[];
  summary: SyncSummary;
}

export interface SyncError {
  rowNumber?: number;
  field?: string;
  error: string;
  severity: 'error' | 'warning';
  data?: any;
}

export interface SyncSummary {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  warningRecords: number;
  dataQualityScore: number;
  syncDuration: number; // milliseconds
}

export interface DataIntegrationWorkflow {
  id: string;
  name: string;
  description: string;
  dataSourceIds: string[];
  steps: IntegrationStep[];
  schedule: WorkflowSchedule;
  notifications: NotificationConfig[];
}

export interface IntegrationStep {
  id: string;
  name: string;
  type: 'extract' | 'transform' | 'validate' | 'load' | 'notify';
  config: Record<string, any>;
  retryPolicy: RetryPolicy;
}

export interface WorkflowSchedule {
  frequency: 'manual' | 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  specificTime?: string; // For daily/weekly schedules
  dayOfWeek?: number; // For weekly schedules
  dayOfMonth?: number; // For monthly schedules
  timezone: string;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack';
  recipients: string[];
  triggers: ('success' | 'failure' | 'warning' | 'start')[];
  template: string;
}

class DataSourceIntegrationService {

  /**
   * Get available data source types and their capabilities
   */
  getDataSourceTypes(): Array<{
    type: string;
    name: string;
    description: string;
    capabilities: string[];
    configFields: string[];
    supportedFormats: string[];
  }> {
    return [
      {
        type: 'kobo_toolbox',
        name: 'KoboToolbox',
        description: 'Mobile data collection platform for humanitarian and development work',
        capabilities: ['real_time_sync', 'form_based', 'mobile_optimized', 'offline_support'],
        configFields: ['koboServer', 'koboUsername', 'koboPassword', 'koboFormId'],
        supportedFormats: ['json', 'csv', 'xml']
      },
      {
        type: 'airtable',
        name: 'Airtable',
        description: 'Cloud-based database platform with spreadsheet interface',
        capabilities: ['real_time_sync', 'api_access', 'structured_data', 'collaboration'],
        configFields: ['airtableApiKey', 'airtableBaseId', 'airtableTableName'],
        supportedFormats: ['json']
      },
      {
        type: 'google_sheets',
        name: 'Google Sheets',
        description: 'Cloud-based spreadsheet application',
        capabilities: ['real_time_sync', 'collaborative_editing', 'formula_support'],
        configFields: ['googleSheetId', 'googleServiceAccountKey', 'googleSheetRange'],
        supportedFormats: ['csv', 'json']
      },
      {
        type: 'excel',
        name: 'Excel Files',
        description: 'Microsoft Excel spreadsheet files (.xlsx, .xls)',
        capabilities: ['batch_upload', 'formula_support', 'multiple_sheets'],
        configFields: ['filePath', 'sheetName', 'headerRow'],
        supportedFormats: ['xlsx', 'xls', 'csv']
      },
      {
        type: 'commcare',
        name: 'CommCare',
        description: 'Mobile platform for frontline workers in low-resource settings',
        capabilities: ['mobile_data_collection', 'case_management', 'workflow_support'],
        configFields: ['commcareApiKey', 'comcareUsername', 'commcarePassword', 'commcareDomain'],
        supportedFormats: ['json', 'xml']
      },
      {
        type: 'survey_monkey',
        name: 'SurveyMonkey',
        description: 'Online survey development cloud-based software',
        capabilities: ['survey_responses', 'analytics', 'real_time_results'],
        configFields: ['surveyMonkeyApiKey', 'surveyId'],
        supportedFormats: ['json', 'csv']
      },
      {
        type: 'csv_upload',
        name: 'CSV Upload',
        description: 'Upload CSV files directly for one-time or periodic imports',
        capabilities: ['batch_upload', 'flexible_format', 'manual_control'],
        configFields: ['filePath', 'delimiter', 'encoding', 'headerRow'],
        supportedFormats: ['csv', 'tsv']
      },
      {
        type: 'api',
        name: 'Custom API',
        description: 'Connect to any REST API endpoint',
        capabilities: ['real_time_sync', 'custom_endpoints', 'flexible_authentication'],
        configFields: ['apiEndpoint', 'apiKey', 'apiHeaders', 'apiMethod'],
        supportedFormats: ['json', 'xml', 'csv']
      }
    ];
  }

  /**
   * Create a new data source
   */
  async createDataSource(
    organizationId: string,
    dataSourceConfig: {
      name: string;
      type: string;
      description?: string;
      connectionConfig: DataSourceConfig;
      autoSync?: boolean;
      syncFrequency?: string;
    },
    createdBy: string
  ): Promise<DataSource> {
    // Validate configuration based on data source type
    await this.validateDataSourceConfig(dataSourceConfig.type, dataSourceConfig.connectionConfig);

    const dataSource: DataSource = {
      id: `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: dataSourceConfig.name,
      type: dataSourceConfig.type as any,
      description: dataSourceConfig.description || '',
      connectionConfig: dataSourceConfig.connectionConfig,
      status: 'pending',
      lastSync: null,
      autoSync: dataSourceConfig.autoSync || false,
      syncFrequency: (dataSourceConfig.syncFrequency as any) || 'manual',
      organizationId,
      createdBy,
      fieldMappings: [],
      dataValidation: {
        enableValidation: true,
        stopOnError: false,
        validationRules: [],
        customValidations: []
      },
      syncHistory: []
    };

    // Test connection
    try {
      const connectionTest = await this.testDataSourceConnection(dataSource);
      dataSource.status = connectionTest.success ? 'connected' : 'error';
    } catch (error) {
      dataSource.status = 'error';
    }

    // In a real implementation, this would save to database
    console.log('Data source created:', dataSource.id);

    return dataSource;
  }

  /**
   * Test data source connection
   */
  async testDataSourceConnection(dataSource: DataSource): Promise<{
    success: boolean;
    message: string;
    sampleData?: any[];
    availableFields?: string[];
  }> {
    try {
      switch (dataSource.type) {
        case 'kobo_toolbox':
          return await this.testKoboConnection(dataSource.connectionConfig);
        
        case 'airtable':
          return await this.testAirtableConnection(dataSource.connectionConfig);
        
        case 'google_sheets':
          return await this.testGoogleSheetsConnection(dataSource.connectionConfig);
        
        case 'excel':
          return await this.testExcelConnection(dataSource.connectionConfig);
        
        case 'commcare':
          return await this.testCommCareConnection(dataSource.connectionConfig);
        
        case 'api':
          return await this.testApiConnection(dataSource.connectionConfig);
        
        default:
          return {
            success: false,
            message: `Unsupported data source type: ${dataSource.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  private async testKoboConnection(config: DataSourceConfig): Promise<any> {
    // Mock implementation - would make actual API call to KoboToolbox
    if (!config.koboServer || !config.koboUsername || !config.koboFormId) {
      throw new Error('Missing required KoboToolbox configuration');
    }

    // Simulate API call
    return {
      success: true,
      message: 'KoboToolbox connection successful',
      sampleData: [
        { id: 1, submission_time: '2025-01-19T10:00:00Z', beneficiary_name: 'John Doe', satisfaction_score: 8 },
        { id: 2, submission_time: '2025-01-19T11:00:00Z', beneficiary_name: 'Jane Smith', satisfaction_score: 9 }
      ],
      availableFields: ['id', 'submission_time', 'beneficiary_name', 'satisfaction_score', 'comments']
    };
  }

  private async testAirtableConnection(config: DataSourceConfig): Promise<any> {
    if (!config.airtableApiKey || !config.airtableBaseId || !config.airtableTableName) {
      throw new Error('Missing required Airtable configuration');
    }

    return {
      success: true,
      message: 'Airtable connection successful',
      sampleData: [
        { id: 'rec123', fields: { Name: 'Project Alpha', Status: 'Active', Impact_Score: 85 } },
        { id: 'rec456', fields: { Name: 'Project Beta', Status: 'Completed', Impact_Score: 92 } }
      ],
      availableFields: ['Name', 'Status', 'Impact_Score', 'Start_Date', 'End_Date']
    };
  }

  private async testGoogleSheetsConnection(config: DataSourceConfig): Promise<any> {
    if (!config.googleSheetId || !config.googleServiceAccountKey) {
      throw new Error('Missing required Google Sheets configuration');
    }

    return {
      success: true,
      message: 'Google Sheets connection successful',
      sampleData: [
        { Program: 'Education Initiative', Students: 150, Completion_Rate: 0.85 },
        { Program: 'Health Campaign', Participants: 300, Completion_Rate: 0.92 }
      ],
      availableFields: ['Program', 'Students', 'Participants', 'Completion_Rate', 'Date']
    };
  }

  private async testExcelConnection(config: DataSourceConfig): Promise<any> {
    if (!config.filePath) {
      throw new Error('Missing required Excel file configuration');
    }

    return {
      success: true,
      message: 'Excel file connection successful',
      sampleData: [
        { Indicator: 'Student Satisfaction', Q1: 78, Q2: 82, Q3: 85, Q4: 88 },
        { Indicator: 'Retention Rate', Q1: 0.89, Q2: 0.91, Q3: 0.93, Q4: 0.95 }
      ],
      availableFields: ['Indicator', 'Q1', 'Q2', 'Q3', 'Q4', 'Annual_Average']
    };
  }

  private async testCommCareConnection(config: DataSourceConfig): Promise<any> {
    if (!config.commcareApiKey || !config.commcareDomain) {
      throw new Error('Missing required CommCare configuration');
    }

    return {
      success: true,
      message: 'CommCare connection successful',
      sampleData: [
        { case_id: 'case123', form_type: 'assessment', score: 75, date_submitted: '2025-01-19' },
        { case_id: 'case456', form_type: 'followup', score: 82, date_submitted: '2025-01-18' }
      ],
      availableFields: ['case_id', 'form_type', 'score', 'date_submitted', 'worker_id']
    };
  }

  private async testApiConnection(config: DataSourceConfig): Promise<any> {
    if (!config.apiEndpoint) {
      throw new Error('Missing required API endpoint configuration');
    }

    return {
      success: true,
      message: 'API connection successful',
      sampleData: [
        { id: 1, timestamp: '2025-01-19T10:00:00Z', metric: 'user_engagement', value: 0.75 },
        { id: 2, timestamp: '2025-01-19T11:00:00Z', metric: 'completion_rate', value: 0.89 }
      ],
      availableFields: ['id', 'timestamp', 'metric', 'value', 'category']
    };
  }

  /**
   * Configure field mappings for data source
   */
  async configureFieldMappings(
    dataSourceId: string,
    mappings: Array<{
      sourceField: string;
      targetField: string;
      dataType: string;
      required?: boolean;
      transformation?: FieldTransformation;
      validation?: FieldValidation;
    }>
  ): Promise<FieldMapping[]> {
    const fieldMappings: FieldMapping[] = mappings.map(mapping => ({
      sourceField: mapping.sourceField,
      targetField: mapping.targetField,
      dataType: mapping.dataType as any,
      required: mapping.required || false,
      ...(mapping.transformation && { transformation: mapping.transformation }),
      ...(mapping.validation && { validation: mapping.validation })
    }));

    // Validate field mappings
    const validationResult = this.validateFieldMappings(fieldMappings);
    if (!validationResult.valid) {
      throw new Error(`Field mapping validation failed: ${validationResult.errors.join(', ')}`);
    }

    // In real implementation, save to database
    console.log(`Field mappings configured for data source: ${dataSourceId}`);

    return fieldMappings;
  }

  private validateFieldMappings(mappings: FieldMapping[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate target fields
    const targetFields = mappings.map(m => m.targetField);
    const duplicates = targetFields.filter((field, index) => targetFields.indexOf(field) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate target fields: ${duplicates.join(', ')}`);
    }

    // Validate required field mappings
    const requiredMappings = mappings.filter(m => m.required);
    if (requiredMappings.length === 0) {
      errors.push('At least one field mapping must be marked as required');
    }

    // Validate data type consistency
    for (const mapping of mappings) {
      if (mapping.validation) {
        const validation = mapping.validation;
        if (mapping.dataType === 'number') {
          if (validation.minLength || validation.maxLength || validation.pattern) {
            errors.push(`String validations not applicable to number field: ${mapping.targetField}`);
          }
        }
        if (mapping.dataType === 'string') {
          if (validation.minValue || validation.maxValue) {
            errors.push(`Number validations not applicable to string field: ${mapping.targetField}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sync data from data source
   */
  async syncDataSource(dataSourceId: string): Promise<SyncRecord> {
    // Mock implementation - would perform actual data sync
    const syncRecord: SyncRecord = {
      id: `sync_${Date.now()}`,
      dataSourceId,
      startedAt: new Date(),
      completedAt: null,
      status: 'running',
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      summary: {
        totalRecords: 0,
        newRecords: 0,
        updatedRecords: 0,
        skippedRecords: 0,
        errorRecords: 0,
        warningRecords: 0,
        dataQualityScore: 0,
        syncDuration: 0
      }
    };

    try {
      // Simulate data sync process
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time

      // Mock sync results
      syncRecord.status = 'completed';
      syncRecord.completedAt = new Date();
      syncRecord.recordsProcessed = 150;
      syncRecord.recordsSuccessful = 145;
      syncRecord.recordsFailed = 5;
      syncRecord.summary = {
        totalRecords: 150,
        newRecords: 120,
        updatedRecords: 25,
        skippedRecords: 0,
        errorRecords: 5,
        warningRecords: 8,
        dataQualityScore: 92.5,
        syncDuration: 1000
      };

      // Add some mock errors
      syncRecord.errors = [
        {
          rowNumber: 23,
          field: 'satisfaction_score',
          error: 'Value out of range (0-10)',
          severity: 'error',
          data: { satisfaction_score: 15 }
        },
        {
          rowNumber: 45,
          field: 'date_collected',
          error: 'Invalid date format',
          severity: 'error',
          data: { date_collected: 'invalid-date' }
        }
      ];

    } catch (error) {
      syncRecord.status = 'failed';
      syncRecord.completedAt = new Date();
      syncRecord.errors.push({
        error: error instanceof Error ? error.message : 'Unknown sync error',
        severity: 'error'
      });
    }

    return syncRecord;
  }

  /**
   * Get data source sync history
   */
  async getSyncHistory(
    dataSourceId: string,
    limit: number = 50
  ): Promise<SyncRecord[]> {
    // Mock implementation - would query actual sync history
    return [
      {
        id: 'sync_recent',
        dataSourceId,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000), // 30 seconds later
        status: 'completed',
        recordsProcessed: 150,
        recordsSuccessful: 145,
        recordsFailed: 5,
        errors: [],
        summary: {
          totalRecords: 150,
          newRecords: 120,
          updatedRecords: 25,
          skippedRecords: 0,
          errorRecords: 5,
          warningRecords: 8,
          dataQualityScore: 92.5,
          syncDuration: 30000
        }
      }
    ];
  }

  /**
   * Get intelligent field mapping suggestions
   */
  async getFieldMappingSuggestions(
    sourceFields: string[],
    targetSchema: Array<{ field: string; type: string; description?: string }>
  ): Promise<Array<{
    sourceField: string;
    suggestedTarget: string;
    confidence: number;
    reasoning: string;
    alternativeTargets: Array<{ field: string; confidence: number }>;
  }>> {
    const suggestions = [];

    for (const sourceField of sourceFields) {
      const suggestion = this.generateFieldMappingSuggestion(sourceField, targetSchema);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  private generateFieldMappingSuggestion(
    sourceField: string,
    targetSchema: Array<{ field: string; type: string; description?: string }>
  ): any {
    const sourceFieldLower = sourceField.toLowerCase();
    const alternatives = [];

    // Exact match
    for (const target of targetSchema) {
      const targetFieldLower = target.field.toLowerCase();
      
      if (sourceFieldLower === targetFieldLower) {
        return {
          sourceField,
          suggestedTarget: target.field,
          confidence: 0.95,
          reasoning: 'Exact field name match',
          alternativeTargets: []
        };
      }

      // Partial matches and semantic similarity
      let confidence = 0;
      let reasoning = '';

      // Common field name patterns
      if (this.isFieldNameSimilar(sourceFieldLower, targetFieldLower)) {
        confidence = 0.8;
        reasoning = 'Similar field name';
      } else if (this.isSemanticallySimilar(sourceFieldLower, targetFieldLower)) {
        confidence = 0.6;
        reasoning = 'Semantically similar';
      } else if (sourceFieldLower.includes(targetFieldLower) || targetFieldLower.includes(sourceFieldLower)) {
        confidence = 0.7;
        reasoning = 'Partial field name match';
      }

      if (confidence > 0.5) {
        alternatives.push({ field: target.field, confidence });
      }
    }

    if (alternatives.length > 0) {
      // Sort by confidence and return the best match
      alternatives.sort((a, b) => b.confidence - a.confidence);
      const best = alternatives[0]!;
      
      return {
        sourceField,
        suggestedTarget: best.field,
        confidence: best.confidence,
        reasoning: `Best match from ${alternatives.length} candidates`,
        alternativeTargets: alternatives.slice(1)
      };
    }

    return null;
  }

  private isFieldNameSimilar(field1: string, field2: string): boolean {
    // Remove common separators and compare
    const normalize = (str: string) => str.replace(/[_\-\s]/g, '').toLowerCase();
    return normalize(field1) === normalize(field2);
  }

  private isSemanticallySimilar(field1: string, field2: string): boolean {
    // Simple semantic similarity based on common synonyms
    const synonymGroups = [
      ['id', 'identifier', 'key', 'reference'],
      ['name', 'title', 'label'],
      ['date', 'timestamp', 'time', 'when'],
      ['value', 'amount', 'score', 'result'],
      ['status', 'state', 'condition'],
      ['type', 'category', 'class', 'kind'],
      ['description', 'notes', 'comments', 'details']
    ];

    for (const group of synonymGroups) {
      if (group.some(word => field1.includes(word)) && group.some(word => field2.includes(word))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate data source configuration
   */
  private async validateDataSourceConfig(type: string, config: DataSourceConfig): Promise<void> {
    const requiredFields = this.getRequiredConfigFields(type);
    
    for (const field of requiredFields) {
      if (!config[field as keyof DataSourceConfig]) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }
  }

  private getRequiredConfigFields(type: string): string[] {
    const typeConfigs = this.getDataSourceTypes();
    const typeConfig = typeConfigs.find(t => t.type === type);
    return typeConfig?.configFields || [];
  }

  /**
   * Get data integration analytics
   */
  async getIntegrationAnalytics(organizationId: string): Promise<{
    overview: {
      totalDataSources: number;
      activeConnections: number;
      totalRecordsSync: number;
      averageQualityScore: number;
      lastSyncErrors: number;
    };
    syncPerformance: Array<{
      date: string;
      recordsProcessed: number;
      successRate: number;
      averageDuration: number;
    }>;
    dataSourceStatus: Array<{
      name: string;
      type: string;
      status: string;
      lastSync: Date | null;
      qualityScore: number;
    }>;
    qualityTrends: Array<{
      date: string;
      overallQuality: number;
      completeness: number;
      accuracy: number;
      timeliness: number;
    }>;
  }> {
    // Mock analytics data - would be calculated from actual sync records
    return {
      overview: {
        totalDataSources: 5,
        activeConnections: 4,
        totalRecordsSync: 12450,
        averageQualityScore: 89.2,
        lastSyncErrors: 12
      },
      syncPerformance: [
        { date: '2025-01-15', recordsProcessed: 2100, successRate: 0.94, averageDuration: 45 },
        { date: '2025-01-16', recordsProcessed: 2300, successRate: 0.96, averageDuration: 42 },
        { date: '2025-01-17', recordsProcessed: 2150, successRate: 0.93, averageDuration: 48 },
        { date: '2025-01-18', recordsProcessed: 2400, successRate: 0.97, averageDuration: 41 },
        { date: '2025-01-19', recordsProcessed: 2500, successRate: 0.95, averageDuration: 44 }
      ],
      dataSourceStatus: [
        { name: 'Student Survey (KoboToolbox)', type: 'kobo_toolbox', status: 'connected', lastSync: new Date(), qualityScore: 92 },
        { name: 'Program Data (Airtable)', type: 'airtable', status: 'connected', lastSync: new Date(), qualityScore: 88 },
        { name: 'Financial Reports (Excel)', type: 'excel', status: 'connected', lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000), qualityScore: 85 },
        { name: 'Field Data (CommCare)', type: 'commcare', status: 'error', lastSync: new Date(Date.now() - 48 * 60 * 60 * 1000), qualityScore: 78 }
      ],
      qualityTrends: [
        { date: '2025-01-15', overallQuality: 87.2, completeness: 89.1, accuracy: 91.5, timeliness: 81.8 },
        { date: '2025-01-16', overallQuality: 88.1, completeness: 90.2, accuracy: 92.1, timeliness: 82.5 },
        { date: '2025-01-17', overallQuality: 88.9, completeness: 91.1, accuracy: 92.8, timeliness: 83.1 },
        { date: '2025-01-18', overallQuality: 89.5, completeness: 91.8, accuracy: 93.2, timeliness: 83.8 },
        { date: '2025-01-19', overallQuality: 89.2, completeness: 91.5, accuracy: 93.1, timeliness: 83.5 }
      ]
    };
  }
}

export default new DataSourceIntegrationService();