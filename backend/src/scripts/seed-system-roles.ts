/**
 * System Roles and Permissions Seeder
 * Defines the role hierarchy and permissions for the Impact Bot platform
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export enum SystemRoles {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  IMPACT_MANAGER = 'impact_manager',
  IMPACT_ANALYST = 'impact_analyst',
  REPORT_VIEWER = 'report_viewer',
  EXTERNAL_EVALUATOR = 'evaluator',
}

const roleDefinitions = {
  [SystemRoles.SUPER_ADMIN]: {
    name: 'super_admin',
    description: 'Platform administrator with full system access',
    permissions: ['*'] // All permissions
  },
  [SystemRoles.ORG_ADMIN]: {
    name: 'org_admin',
    description: 'Organization administrator with full organization management',
    permissions: [
      // Organization Management
      'org:*',
      'user:*',
      
      // Foundation & Setup
      'foundation:assess',
      'foundation:configure',
      'foundation:view_status',
      'foundation:manage_phases',
      
      // Measurement & Reporting
      'measurement:*',
      'report:*',
      'indicator:*',
      'conversation:*',
      'theory:*',
      
      // Member Management
      'member:invite',
      'member:manage_roles',
      'member:remove',
      
      // Settings & Preferences
      'settings:org_privacy',
      'settings:notifications',
      'settings:org_profile'
    ]
  },
  [SystemRoles.IMPACT_MANAGER]: {
    name: 'impact_manager',
    description: 'Impact measurement manager with full measurement access',
    permissions: [
      // Foundation Access
      'foundation:assess',
      'foundation:view_status',
      
      // Core Measurement Functions
      'measurement:*',
      'report:*',
      'indicator:*',
      'conversation:*',
      
      // Theory of Change
      'theory:read',
      'theory:edit',
      'theory:create',
      
      // User Management (limited)
      'user:read',
      'user:view_profiles',
      
      // Organization (limited)
      'org:read',
      'org:view_members',
      
      // Settings (personal)
      'settings:personal_preferences',
      'settings:notification_preferences'
    ]
  },
  [SystemRoles.IMPACT_ANALYST]: {
    name: 'impact_analyst',
    description: 'Impact analyst with measurement creation and editing access',
    permissions: [
      // Foundation (view only)
      'foundation:view_status',
      
      // Measurement Creation & Editing
      'measurement:create',
      'measurement:edit',
      'measurement:read',
      
      // Reporting (create & read)
      'report:read',
      'report:create',
      'report:edit_own',
      
      // Indicators
      'indicator:read',
      'indicator:create',
      'indicator:edit_own',
      
      // Conversations & AI
      'conversation:*',
      
      // Theory of Change (read only)
      'theory:read',
      
      // Organization (read only)
      'org:read',
      'user:read',
      
      // Settings (personal only)
      'settings:personal_preferences'
    ]
  },
  [SystemRoles.REPORT_VIEWER]: {
    name: 'report_viewer',
    description: 'Read-only access to reports and measurements',
    permissions: [
      // Foundation (view only)
      'foundation:view_status',
      
      // Read-only Access
      'report:read',
      'measurement:read',
      'indicator:read',
      'theory:read',
      
      // Limited Conversations
      'conversation:read',
      'conversation:ask_questions',
      
      // Organization (limited view)
      'org:read',
      'user:read',
      
      // Settings (personal only)
      'settings:personal_preferences'
    ]
  },
  [SystemRoles.EXTERNAL_EVALUATOR]: {
    name: 'evaluator',
    description: 'External evaluator with limited access to assigned reports',
    permissions: [
      // Assigned Content Only
      'report:read:assigned',
      'measurement:read:assigned',
      'indicator:read:assigned',
      
      // Evaluation Functions
      'comment:create',
      'comment:edit_own',
      'evaluation:submit',
      
      // Limited Conversations
      'conversation:read',
      'conversation:ask_questions:assigned',
      
      // No Foundation Access (external user)
      
      // Settings (minimal)
      'settings:personal_preferences'
    ]
  }
};

export async function seedSystemRoles(): Promise<void> {
  try {
    logger.info('🌱 Seeding system roles and permissions...');

    // Clear existing roles if in development
    if (process.env.NODE_ENV === 'development') {
      await prisma.userOrganization.deleteMany();
      await prisma.role.deleteMany();
      logger.info('Cleared existing roles for fresh seed');
    }

    // Create roles
    for (const [roleKey, roleDef] of Object.entries(roleDefinitions)) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleDef.name }
      });

      if (!existingRole) {
        await prisma.role.create({
          data: {
            id: uuidv4(),
            name: roleDef.name,
            description: roleDef.description,
            permissions: roleDef.permissions
          }
        });
        logger.info(`✅ Created role: ${roleDef.name}`);
      } else {
        // Update permissions if they've changed
        await prisma.role.update({
          where: { id: existingRole.id },
          data: {
            description: roleDef.description,
            permissions: roleDef.permissions
          }
        });
        logger.info(`🔄 Updated role: ${roleDef.name}`);
      }
    }

    logger.info('✅ System roles seeded successfully');
  } catch (error) {
    logger.error('❌ Failed to seed system roles:', error);
    throw error;
  }
}

export async function getRoleByName(roleName: string) {
  return await prisma.role.findUnique({
    where: { name: roleName }
  });
}

// Run directly if called as script
if (require.main === module) {
  seedSystemRoles()
    .then(() => {
      logger.info('Role seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Role seeding failed:', error);
      process.exit(1);
    });
}