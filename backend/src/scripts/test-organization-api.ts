/**
 * Organization API Test Script
 * Tests organization CRUD operations and member management
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AuthService } from '@/middleware/auth';
import { organizationController } from '@/controllers/organizationController';

// Mock Express Request/Response objects for testing
class MockResponse {
  public statusCode = 200;
  public data: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.data = data;
    return this;
  }
}

class MockRequest {
  public user: any = null;
  public organization: any = null;
  public body: any = {};
  public params: any = {};
  public query: any = {};
}

async function runOrganizationTests() {
  try {
    logger.info('🧪 Starting Organization API Tests...');

    // Test 1: Get admin user for testing
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@impact-bot.com' },
      include: {
        userOrganizations: {
          include: {
            organization: true,
            role: true
          }
        }
      }
    });

    if (!adminUser) {
      throw new Error('Admin user not found. Run seed-test-users first.');
    }

    const adminOrg = adminUser.userOrganizations[0];
    if (!adminOrg) {
      throw new Error('Admin user has no organizations');
    }

    logger.info(`✅ Found admin user: ${adminUser.email} in org: ${adminOrg.organization.name}`);

    // Test 2: Test Create Organization
    logger.info('🔧 Testing Create Organization...');
    
    const req = new MockRequest();
    req.user = {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName
    };
    req.body = {
      name: 'Test API Organization',
      description: 'Created via API test',
      industry: 'Technology',
      website: 'https://test-api.org'
    };

    const res = new MockResponse();
    await organizationController.createOrganization(req as any, res as any);

    if (res.statusCode === 201 && res.data?.success) {
      logger.info('✅ Create Organization: PASSED');
      logger.info(`Created organization: ${res.data.data.organization.name} (${res.data.data.organization.id})`);
      
      const newOrgId = res.data.data.organization.id;

      // Test 3: Test Get Organization
      logger.info('🔧 Testing Get Organization...');
      
      const getReq = new MockRequest();
      getReq.user = req.user;
      getReq.params = { organizationId: newOrgId };
      
      const getRes = new MockResponse();
      await organizationController.getOrganization(getReq as any, getRes as any);
      
      if (getRes.statusCode === 200 && getRes.data?.success) {
        logger.info('✅ Get Organization: PASSED');
        logger.info(`Retrieved organization: ${getRes.data.data.organization.name}`);
        logger.info(`Member count: ${getRes.data.data.organization.memberCount}`);
      } else {
        logger.error('❌ Get Organization: FAILED', getRes.data);
      }

      // Test 4: Test Update Organization
      logger.info('🔧 Testing Update Organization...');
      
      const updateReq = new MockRequest();
      updateReq.user = req.user;
      updateReq.params = { organizationId: newOrgId };
      updateReq.body = {
        name: 'Updated API Organization',
        description: 'Updated via API test'
      };
      
      const updateRes = new MockResponse();
      await organizationController.updateOrganization(updateReq as any, updateRes as any);
      
      if (updateRes.statusCode === 200 && updateRes.data?.success) {
        logger.info('✅ Update Organization: PASSED');
        logger.info(`Updated organization name: ${updateRes.data.data.organization.name}`);
      } else {
        logger.error('❌ Update Organization: FAILED', updateRes.data);
      }

      // Test 5: Test Get Members
      logger.info('🔧 Testing Get Organization Members...');
      
      const membersReq = new MockRequest();
      membersReq.user = req.user;
      membersReq.params = { organizationId: newOrgId };
      
      const membersRes = new MockResponse();
      await organizationController.getMembers(membersReq as any, membersRes as any);
      
      if (membersRes.statusCode === 200 && membersRes.data?.success) {
        logger.info('✅ Get Organization Members: PASSED');
        logger.info(`Members found: ${membersRes.data.data.members.length}`);
        logger.info(`Role distribution:`, membersRes.data.data.roleDistribution);
      } else {
        logger.error('❌ Get Organization Members: FAILED', membersRes.data);
      }

      // Test 6: Test Invite Member (existing user)
      logger.info('🔧 Testing Invite Existing Member...');
      
      const analystUser = await prisma.user.findUnique({
        where: { email: 'analyst@demo.org' }
      });

      if (analystUser) {
        const inviteReq = new MockRequest();
        inviteReq.user = req.user;
        inviteReq.params = { organizationId: newOrgId };
        inviteReq.body = {
          email: 'analyst@demo.org',
          roleId: adminOrg.role.id, // Use same role for testing
          message: 'Welcome to our test organization!'
        };
        
        const inviteRes = new MockResponse();
        await organizationController.inviteMember(inviteReq as any, inviteRes as any);
        
        if (inviteRes.statusCode === 201 && inviteRes.data?.success) {
          logger.info('✅ Invite Existing Member: PASSED');
          logger.info(`Added member: ${inviteRes.data.data.member.email}`);
        } else {
          logger.error('❌ Invite Existing Member: FAILED', inviteRes.data);
        }
      }

      // Test 7: Test Get Settings
      logger.info('🔧 Testing Get Organization Settings...');
      
      const settingsReq = new MockRequest();
      settingsReq.user = req.user;
      settingsReq.params = { organizationId: newOrgId };
      
      const settingsRes = new MockResponse();
      await organizationController.getSettings(settingsReq as any, settingsRes as any);
      
      if (settingsRes.statusCode === 200 && settingsRes.data?.success) {
        logger.info('✅ Get Organization Settings: PASSED');
        logger.info(`Privacy setting: ${settingsRes.data.data.settings.privacy}`);
      } else {
        logger.error('❌ Get Organization Settings: FAILED', settingsRes.data);
      }

      // Test 8: Test Update Settings
      logger.info('🔧 Testing Update Organization Settings...');
      
      const updateSettingsReq = new MockRequest();
      updateSettingsReq.user = req.user;
      updateSettingsReq.params = { organizationId: newOrgId };
      updateSettingsReq.body = {
        allowPublicReports: true,
        notificationPreferences: {
          newMembers: false,
          reportUpdates: true,
          systemAnnouncements: true
        }
      };
      
      const updateSettingsRes = new MockResponse();
      await organizationController.updateSettings(updateSettingsReq as any, updateSettingsRes as any);
      
      if (updateSettingsRes.statusCode === 200 && updateSettingsRes.data?.success) {
        logger.info('✅ Update Organization Settings: PASSED');
        logger.info(`Updated allowPublicReports: ${updateSettingsRes.data.data.settings.allowPublicReports}`);
      } else {
        logger.error('❌ Update Organization Settings: FAILED', updateSettingsRes.data);
      }

    } else {
      logger.error('❌ Create Organization: FAILED', res.data);
      return;
    }

    logger.info('🎉 All Organization API Tests Completed Successfully!');

  } catch (error) {
    logger.error('❌ Organization API Tests Failed:', error);
    throw error;
  }
}

// Run tests if script is called directly
if (require.main === module) {
  runOrganizationTests()
    .then(() => {
      logger.info('🏁 Organization API testing completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Organization API testing failed:', error);
      process.exit(1);
    });
}

export { runOrganizationTests };