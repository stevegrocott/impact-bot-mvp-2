/**
 * Database Configuration and Connection Management
 * Optimized Prisma setup with connection pooling and monitoring
 */

import { PrismaClient } from '@prisma/client';
import { config } from './environment';
import { logger } from '@/utils/logger';

// Prisma client configuration for production optimization
const prismaConfig: any = {
  datasources: {
    db: {
      url: config.DATABASE_URL
    }
  },
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
  errorFormat: 'pretty'
};

// Create Prisma client instance
export const prisma = new PrismaClient(prismaConfig);

// Database connection monitoring
if (config.NODE_ENV !== 'test') {
  // Simple connection test on startup
  prisma.$connect().then(() => {
    logger.info('Database connected successfully');
  }).catch((error) => {
    logger.error('Database connection failed', { error: error.message });
  });
}

// Database health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

// Database metrics collection
export async function getDatabaseMetrics() {
  try {
    const [
      connectionInfo,
      tableStats,
      indexUsage,
      slowQueries
    ] = await Promise.all([
      // Connection information
      prisma.$queryRaw`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          inet_server_addr() as server_address,
          inet_server_port() as server_port,
          version() as postgres_version
      `,
      
      // Table statistics
      prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `,
      
      // Index usage statistics
      prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE idx_scan > 0
        ORDER BY idx_scan DESC
        LIMIT 10
      `,
      
      // Slow queries (if pg_stat_statements is enabled)
      prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE calls > 10
        ORDER BY mean_time DESC
        LIMIT 5
      `.catch(() => []) // Ignore if pg_stat_statements not available
    ]);

    return {
      connection: connectionInfo,
      tables: tableStats,
      indexes: indexUsage,
      slowQueries: slowQueries,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to collect database metrics', { error });
    return null;
  }
}

// Refresh materialized views function
export async function refreshMaterializedViews(): Promise<void> {
  try {
    logger.info('Refreshing materialized views');
    
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_to_data_requirements`;
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sdg_to_indicators`;
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_theme_relationships`;
    
    logger.info('Materialized views refreshed successfully');
  } catch (error) {
    logger.error('Failed to refresh materialized views', { error });
    throw error;
  }
}

// Database optimization utilities
export class DatabaseUtils {
  
  /**
   * Execute a transaction with automatic retry logic
   */
  static async executeTransaction<T>(
    operation: (tx: any) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.$transaction(operation, {
          maxWait: 5000,
          timeout: 30000,
          isolationLevel: 'ReadCommitted'
        });
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (this.isRetryableError(error)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.warn(`Transaction failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries,
            error: (error as Error).message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Check if database error is retryable
   */
  private static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'P2024', // Timed out fetching a new connection
      'P2034', // Transaction failed due to a write conflict
      '40001', // Serialization failure
      '40P01', // Deadlock detected
    ];
    
    return retryableCodes.some(code => 
      error?.code === code || error?.message?.includes(code)
    );
  }
  
  /**
   * Paginate query results efficiently
   */
  static async paginate<T>(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
      page: number;
      limit: number;
    }
  ): Promise<{
    data: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { page, limit, where, orderBy, include, select } = options;
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        include,
        select,
        skip: offset,
        take: limit
      }),
      model.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
}

// Export database utilities
export { DatabaseUtils as db };