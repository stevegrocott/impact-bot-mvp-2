#!/usr/bin/env node
/**
 * Script to delete the test user so registration can be tested again
 */

const { PrismaClient } = require('@prisma/client');

async function deleteTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗑️ Deleting user with email: stephen@grocott.com.au...');
    
    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email: 'stephen@grocott.com.au' },
      include: {
        userOrganizations: {
          include: {
            organization: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('ℹ️ User not found - nothing to delete');
      return;
    }
    
    console.log(`📋 Found user: ${user.firstName} ${user.lastName}`);
    console.log(`📋 Organizations: ${user.userOrganizations.map(o => o.organization.name).join(', ')}`);
    
    // Delete user-organization relationships first
    await prisma.userOrganization.deleteMany({
      where: { userId: user.id }
    });
    
    // Delete the user
    await prisma.user.delete({
      where: { id: user.id }
    });
    
    console.log('✅ User deleted successfully!');
    console.log('🎯 You can now test registration with stephen@grocott.com.au');
    
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestUser();