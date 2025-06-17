/**
 * API Routes Index
 * Central routing configuration for all API endpoints
 */

import { Router } from 'express';
import authRoutes from './auth';
import irisRoutes from './iris';
import conversationRoutes from './conversations';
import indicatorRoutes from './indicators';
import measurementRoutes from './measurements';
import reportRoutes from './reports';
import userRoutes from './users';
import organizationRoutes from './organizations';
import adminRoutes from './admin';
import { theoryOfChangeRoutes } from './theoryOfChangeRoutes';
import { pitfallDetectionRoutes } from './pitfallDetectionRoutes';
import { decisionMappingRoutes } from './decisionMappingRoutes';
import { foundationRoutes } from './foundationRoutes';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'impact-bot-v2-api',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Authentication routes (no auth required for login/register)
router.use('/auth', authRoutes);

// IRIS+ framework routes
router.use('/iris', irisRoutes);

// Conversation and recommendation routes
router.use('/conversations', conversationRoutes);

// Indicator selection and management routes
router.use('/indicators', indicatorRoutes);

// User management routes
router.use('/users', userRoutes);

// Organization management routes
router.use('/organizations', organizationRoutes);

// Measurement tracking routes
router.use('/measurements', measurementRoutes);

// Report generation routes
router.use('/reports', reportRoutes);

// Admin routes (restricted access)
router.use('/admin', adminRoutes);

// Theory of Change routes (foundation-first measurement design)
router.use('/theory-of-change', theoryOfChangeRoutes);

// Pitfall Detection routes (AI-powered prevention)
router.use('/pitfall-detection', pitfallDetectionRoutes);

// Decision Mapping routes (what decisions will this data inform?)
router.use('/decision-mapping', decisionMappingRoutes);

// Foundation readiness routes (phase-gated access control)
router.use('/foundation', foundationRoutes);

export default router;