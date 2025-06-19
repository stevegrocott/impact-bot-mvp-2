/**
 * Development-only routes for testing
 * Only available in development environment
 */

import { Router } from 'express';
import { config } from '@/config/environment';
import { theoryOfChangeService } from '@/services/theoryOfChangeService';
import { logger } from '@/utils/logger';

const router = Router();

// Only enable dev routes in development
if (config.NODE_ENV === 'development') {

  /**
   * Test endpoint for theory of change parsing without authentication
   */
  router.post('/test-theory-parsing', async (req, res): Promise<void> => {
    try {
      logger.info('Development test: theory of change parsing', {
        body: req.body,
        headers: req.headers
      });

      const { documents } = req.body;

      if (!documents || !Array.isArray(documents)) {
        res.status(400).json({
          error: 'Documents array required',
          received: typeof documents
        });
        return;
      }

      // Test the parsing service directly
      const result = await theoryOfChangeService.parseDocuments('test-org-id', documents);

      res.json({
        success: true,
        data: result,
        message: 'Development test - theory of change parsed successfully'
      });

    } catch (error) {
      logger.error('Development test error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No details available'
      });
    }
  });

  /**
   * Test JSON parsing directly
   */
  router.post('/test-json', (req, res) => {
    logger.info('Development test: JSON parsing', {
      body: req.body,
      contentType: req.headers['content-type'],
      rawBody: req.body
    });

    res.json({
      success: true,
      received: req.body,
      type: typeof req.body,
      isObject: typeof req.body === 'object',
      isArray: Array.isArray(req.body),
      keys: typeof req.body === 'object' ? Object.keys(req.body) : 'not object'
    });
  });

  /**
   * Test auth login without middleware
   */
  router.post('/test-login', (req, res) => {
    logger.info('Development test: login attempt', {
      body: req.body,
      contentType: req.headers['content-type']
    });

    const { email, password } = req.body;

    res.json({
      success: true,
      received: { email, password: password ? '[REDACTED]' : undefined },
      bodyType: typeof req.body,
      hasEmail: !!email,
      hasPassword: !!password,
      message: 'Login data received successfully (test endpoint)'
    });
  });

  /**
   * Health check with detailed info
   */
  router.get('/health', (req, res) => {
    res.json({
      message: 'Development routes active',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /api/v1/dev/test-theory-parsing',
        'POST /api/v1/dev/test-json',
        'POST /api/v1/dev/test-login',
        'GET /api/v1/dev/health'
      ]
    });
  });

} else {
  // In production, return 404 for all dev routes
  router.use('*', (req, res) => {
    res.status(404).json({
      error: 'Development routes not available in production'
    });
  });
}

export { router as devRoutes };