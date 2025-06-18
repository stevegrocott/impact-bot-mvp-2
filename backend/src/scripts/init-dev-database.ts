/**
 * Development Database Initializer
 * Automated setup for development environment
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { seedSystemRoles } from './seed-system-roles';
import { seedTestUsers } from './seed-test-users';

export async function initializeDevelopmentDatabase(): Promise<void> {
  try {
    logger.info('🚀 Initializing development database...');

    // Check if we're in development
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('Database initialization only runs in development environment');
      return;
    }

    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connection established');

    // Check if database has been initialized before
    const existingRoles = await prisma.role.count();
    const existingUsers = await prisma.user.count();

    if (existingRoles > 0 && existingUsers > 0) {
      logger.info('📊 Database already initialized with data');
      logger.info(`Found: ${existingRoles} roles, ${existingUsers} users`);
      
      // Check if we have our test users
      const testUser = await prisma.user.findUnique({
        where: { email: 'admin@impact-bot.com' }
      });
      
      if (testUser) {
        logger.info('✅ Development environment ready - test users available');
        return;
      } else {
        logger.info('🔄 Re-seeding test users...');
        await seedTestUsers();
        return;
      }
    }

    // Fresh initialization
    logger.info('🌱 Running fresh database initialization...');

    // Step 1: Seed system roles
    await seedSystemRoles();

    // Step 2: Seed test users
    await seedTestUsers();

    // Step 3: Verify setup
    const finalRoleCount = await prisma.role.count();
    const finalUserCount = await prisma.user.count();
    const finalOrgCount = await prisma.organization.count();

    logger.info('✅ Development database initialized successfully!');
    logger.info(`📊 Created: ${finalRoleCount} roles, ${finalUserCount} users, ${finalOrgCount} organizations`);

    // Show available test accounts
    logger.info('🧪 Test accounts available:');
    logger.info('  admin@impact-bot.com / AdminTest123! (super_admin)');
    logger.info('  orgadmin@demo.org / OrgAdmin123! (org_admin)');
    logger.info('  manager@demo.org / Manager123! (impact_manager)');
    logger.info('  analyst@demo.org / Analyst123! (impact_analyst)');
    logger.info('  viewer@demo.org / Viewer123! (report_viewer)');
    logger.info('  evaluator@external.com / Evaluator123! (evaluator)');

  } catch (error) {
    logger.error('❌ Failed to initialize development database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function checkDevelopmentEnvironment(): Promise<boolean> {
  try {
    // Check database connection
    await prisma.$connect();
    
    // Check for required tables
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const orgCount = await prisma.organization.count();
    
    await prisma.$disconnect();
    
    const isReady = userCount > 0 && roleCount > 0 && orgCount > 0;
    
    if (isReady) {
      logger.info('✅ Development environment health check passed');
    } else {
      logger.warn('⚠️ Development environment needs initialization');
    }
    
    return isReady;
    
  } catch (error) {
    logger.error('❌ Development environment health check failed:', error);
    return false;
  }
}

// Run directly if called as script
if (require.main === module) {
  initializeDevelopmentDatabase()
    .then(() => {
      logger.info('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization failed:', error);
      process.exit(1);
    });
}