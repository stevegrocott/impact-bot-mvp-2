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
      'org:*',
      'user:*',
      'measurement:*',
      'report:*',
      'indicator:*',
      'conversation:*',
      'theory:*'
    ]
  },
  [SystemRoles.IMPACT_MANAGER]: {
    name: 'impact_manager',
    description: 'Impact measurement manager with full measurement access',
    permissions: [
      'measurement:*',
      'report:*',
      'indicator:*',
      'conversation:*',
      'theory:read',
      'theory:edit',
      'user:read'
    ]
  },
  [SystemRoles.IMPACT_ANALYST]: {
    name: 'impact_analyst',
    description: 'Impact analyst with measurement creation and editing access',
    permissions: [
      'measurement:create',
      'measurement:edit',
      'measurement:read',
      'report:read',
      'report:create',
      'indicator:read',
      'indicator:create',
      'conversation:*',
      'theory:read'
    ]
  },
  [SystemRoles.REPORT_VIEWER]: {
    name: 'report_viewer',
    description: 'Read-only access to reports and measurements',
    permissions: [
      'report:read',
      'measurement:read',
      'indicator:read',
      'conversation:read',
      'theory:read'
    ]
  },
  [SystemRoles.EXTERNAL_EVALUATOR]: {
    name: 'evaluator',
    description: 'External evaluator with limited access to assigned reports',
    permissions: [
      'report:read:assigned',
      'measurement:read:assigned',
      'comment:create',
      'conversation:read'
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