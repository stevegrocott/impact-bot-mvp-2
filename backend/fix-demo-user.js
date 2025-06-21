/**
 * Quick fix for demo user organization issue
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function fixDemoUser() {
  try {
    console.log('🔧 Fixing demo user organization setup...');

    // First, let's check what we have
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@impact-bot.com' },
      include: {
        userOrganizations: {
          include: {
            organization: true,
            role: true
          }
        }
      }
    });

    if (existingUser) {
      console.log('👤 Found existing user:', existingUser.email);
      console.log('🏢 Organizations:', existingUser.userOrganizations.length);
      
      if (existingUser.userOrganizations.length > 0) {
        console.log('✅ User already has organizations');
        return;
      }
    }

    // Create or find organization
    let organization = await prisma.organization.findFirst({
      where: { name: 'Demo Organization' }
    });

    if (!organization) {
      console.log('🏢 Creating demo organization...');
      organization = await prisma.organization.create({
        data: {
          id: uuidv4(),
          name: 'Demo Organization',
          description: 'Sample organization for testing and development',
          industry: 'non-profit',
          isActive: true,
          settings: {}
        }
      });
    }

    // Create or find role
    let role = await prisma.role.findFirst({
      where: { name: 'user' }
    });

    if (!role) {
      console.log('👥 Creating user role...');
      role = await prisma.role.create({
        data: {
          id: uuidv4(),
          name: 'user',
          description: 'Standard user access',
          permissions: ['measurement:read', 'measurement:create', 'report:read', 'conversation:*']
        }
      });
    }

    // Create or update user
    const passwordHash = await bcrypt.hash('demo123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'demo@impact-bot.com' },
      update: {
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      },
      create: {
        id: uuidv4(),
        email: 'demo@impact-bot.com',
        passwordHash,
        firstName: 'Demo',
        lastName: 'User',
        jobTitle: 'Impact Measurement Specialist',
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Create user-organization link
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id
        }
      },
      update: {
        roleId: role.id,
        isPrimary: true
      },
      create: {
        id: uuidv4(),
        userId: user.id,
        organizationId: organization.id,
        roleId: role.id,
        isPrimary: true
      }
    });

    console.log('✅ Demo user setup complete:');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🏢 Organization: ${organization.name}`);
    console.log(`   👥 Role: ${role.name}`);
    console.log(`   🔐 Password: demo123`);

  } catch (error) {
    console.error('❌ Error fixing demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoUser();