/**
 * Impact Bot v2 - Production Backend Server
 * Optimized for scale, performance, and LLM training
 */

// Initialize module aliases for compiled JavaScript
// This is needed when running the compiled dist/ files
import 'module-alias/register';

import 'reflect-metadata';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { authMiddleware } from '@/middleware/auth';
import { transformResponse } from '@/middleware/responseTransform';
import { cacheService } from '@/services/cache';
import { prisma } from '@/config/database';
import routes from '@/routes';
import authRoutes from '@/routes/auth';
import { devRoutes } from '@/routes/dev';

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.NODE_ENV === 'production' ? 100 : 1000,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Response transformation (convert snake_case to camelCase)
    this.app.use(transformResponse);

    // Trust proxy headers (for load balancers)
    this.app.set('trust proxy', 1);
  }

  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/health', async (req, res) => {
      console.log('🔥 Health check called - code changes are active!');
      const health = await this.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Auth routes (no authentication required)
    this.app.use('/api/v1/auth', authRoutes);

    // Development routes (no authentication required, dev only)
    this.app.use('/api/v1/dev', devRoutes);

    // All other API routes with authentication
    this.app.use('/api/v1', authMiddleware, routes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async getHealthStatus() {
    const checks = {
      database: false,
      cache: false,
      memory: false
    };

    try {
      // Database health check
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed', { error });
    }

    try {
      // Cache health check
      await cacheService.set('health_check', 'ok', 10);
      const result = await cacheService.get('health_check');
      checks.cache = result === 'ok';
    } catch (error) {
      logger.error('Cache health check failed', { error });
    }

    try {
      // Memory health check
      const memUsage = process.memoryUsage();
      const maxMemory = 1024 * 1024 * 1024; // 1GB threshold
      checks.memory = memUsage.heapUsed < maxMemory;
    } catch (error) {
      logger.error('Memory health check failed', { error });
    }

    const allHealthy = Object.values(checks).every(check => check === true);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
      environment: config.NODE_ENV,
      checks,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await prisma.$connect();
      logger.info('Database connection established');

      // Test cache connection
      await cacheService.ping();
      logger.info('Cache connection established');

      // Start server
      const server = this.app.listen(config.PORT, () => {
        logger.info(`🚀 Impact Bot v2 Backend started`, {
          port: config.PORT,
          environment: config.NODE_ENV,
          nodeVersion: process.version,
          cors: config.CORS_ORIGINS,
          pid: process.pid
        });
      });

      // Graceful shutdown handling
      const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}, starting graceful shutdown`);

        server.close(async () => {
          try {
            await prisma.$disconnect();
            await cacheService.disconnect();
            logger.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown', { error });
            process.exit(1);
          }
        });

        // Force exit after 30 seconds
        setTimeout(() => {
          logger.error('Forceful shutdown after timeout');
          process.exit(1);
        }, 30000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', { error });
        process.exit(1);
      });

      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled rejection', { reason, promise });
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }
}

// Start server
const server = new Server();
server.start().catch((error) => {
  logger.error('Server startup failed', { error });
  process.exit(1);
});