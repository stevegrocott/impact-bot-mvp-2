/**
 * Test Users Seeder
 * Creates test users for each role in the system for development testing
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { SystemRoles, getRoleByName } from './seed-system-roles';

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  role: SystemRoles;
  organizationName: string;
}

const testUsers: TestUser[] = [
  {
    email: 'admin@impact-bot.com',
    password: 'AdminTest123!',
    firstName: 'Super',
    lastName: 'Admin',
    jobTitle: 'Platform Administrator',
    role: SystemRoles.SUPER_ADMIN,
    organizationName: 'Impact Bot Platform'
  },
  {
    email: 'orgadmin@impact-bot.com',
    password: 'OrgAdmin123!',
    firstName: 'Organization',
    lastName: 'Admin',
    jobTitle: 'Executive Director',
    role: SystemRoles.ORG_ADMIN,
    organizationName: 'Impact Bot'
  },
  {
    email: 'manager@impact-bot.com',
    password: 'Manager123!',
    firstName: 'Impact',
    lastName: 'Manager',
    jobTitle: 'Program Manager',
    role: SystemRoles.IMPACT_MANAGER,
    organizationName: 'Impact Bot'
  },
  {
    email: 'analyst@impact-bot.com',
    password: 'Analyst123!',
    firstName: 'Impact',
    lastName: 'Analyst',
    jobTitle: 'Impact Analyst',
    role: SystemRoles.IMPACT_ANALYST,
    organizationName: 'Impact Bot'
  },
  {
    email: 'viewer@impact-bot.com',
    password: 'Viewer123!',
    firstName: 'Report',
    lastName: 'Viewer',
    jobTitle: 'Program Officer',
    role: SystemRoles.REPORT_VIEWER,
    organizationName: 'Impact Bot'
  },
  {
    email: 'evaluator@impact-bot.com',
    password: 'Evaluator123!',
    firstName: 'External',
    lastName: 'Evaluator',
    jobTitle: 'Independent Evaluator',
    role: SystemRoles.EXTERNAL_EVALUATOR,
    organizationName: 'Impact Bot'
  },
  {
    email: 'demo@impact-bot.com',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'User',
    jobTitle: 'Demonstration Account',
    role: SystemRoles.IMPACT_ANALYST,
    organizationName: 'Impact Bot'
  }
];

export async function seedTestUsers(): Promise<void> {
  try {
    logger.info('🧪 Seeding test users for development...');

    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('Test user seeding only runs in development environment');
      return;
    }

    // Clear existing test users if they exist (cascade delete to handle foreign key constraints)
    const testEmails = testUsers.map(u => u.email);
    
    // First, get user IDs that need to be cleaned up
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: testEmails
        }
      },
      select: { id: true }
    });
    
    const userIds = existingUsers.map(u => u.id);
    
    if (userIds.length > 0) {
      // Delete theory of change data that references users 
      await prisma.organizationTheoryOfChange.deleteMany({
        where: {
          createdBy: {
            in: userIds
          }
        }
      });
      
      // Delete decision evolution data
      await prisma.decisionEvolution.deleteMany({
        where: {
          changedBy: {
            in: userIds
          }
        }
      });
      
      // DecisionQuestion doesn't have createdBy, so skip this cleanup
      // The cascade delete from organization cleanup will handle it
      
      // Delete user organization relationships
      await prisma.userOrganization.deleteMany({
        where: {
          userId: {
            in: userIds
          }
        }
      });
      
      // Now safe to delete users
      await prisma.user.deleteMany({
        where: {
          id: {
            in: userIds
          }
        }
      });
      
      logger.info(`Cleared ${userIds.length} existing test users and their data`);
    } else {
      logger.info('No existing test users found to clear');
    }

    // Create test users and organizations
    for (const testUser of testUsers) {
      await prisma.$transaction(async (tx) => {
        // Hash password
        const passwordHash = await bcrypt.hash(testUser.password, 12);

        // Create user
        const user = await tx.user.create({
          data: {
            id: uuidv4(),
            email: testUser.email,
            passwordHash,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            jobTitle: testUser.jobTitle,
            isActive: true,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            preferences: {}
          }
        });

        // Find or create organization
        let organization = await tx.organization.findFirst({
          where: { name: testUser.organizationName }
        });

        if (!organization) {
          organization = await tx.organization.create({
            data: {
              id: uuidv4(),
              name: testUser.organizationName,
              description: `Test organization for ${testUser.role} role`,
              isActive: true,
              settings: {}
            }
          });
        }

        // Get role
        const role = await getRoleByName(testUser.role);
        if (!role) {
          throw new Error(`Role ${testUser.role} not found. Run seed-system-roles first.`);
        }

        // Create user-organization relationship
        await tx.userOrganization.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            organizationId: organization.id,
            roleId: role.id,
            isPrimary: true
          }
        });

        logger.info(`✅ Created test user: ${testUser.email} (${testUser.role})`);
      });
    }

    logger.info('✅ Test users seeded successfully');
    logger.info('📋 Test user credentials:');
    testUsers.forEach(user => {
      logger.info(`  ${user.email} / ${user.password} (${user.role})`);
    });

  } catch (error) {
    logger.error('❌ Failed to seed test users:', error);
    throw error;
  }
}

export async function getTestUserByRole(role: SystemRoles) {
  const testUser = testUsers.find(u => u.role === role);
  if (!testUser) return null;

  return await prisma.user.findUnique({
    where: { email: testUser.email },
    include: {
      userOrganizations: {
        include: {
          organization: true,
          role: true
        }
      }
    }
  });
}

// Run directly if called as script
if (require.main === module) {
  seedTestUsers()
    .then(() => {
      logger.info('Test user seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Test user seeding failed:', error);
      process.exit(1);
    });
}