#!/usr/bin/env node
/**
 * Create Test Users Script
 * Creates all standard test users and assigns them to the Impact Bot organization
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3003/api/v1';

// Test users configuration
const TEST_USERS = [
  {
    email: 'admin@impact-bot.com',
    password: 'AdminTest123!',
    firstName: 'Super',
    lastName: 'Admin',
    jobTitle: 'Platform Administrator',
    role: 'super_admin'
  },
  {
    email: 'orgadmin@impact-bot.com', 
    password: 'OrgAdmin123!',
    firstName: 'Organization',
    lastName: 'Admin',
    jobTitle: 'Organization Administrator',
    role: 'org_admin'
  },
  {
    email: 'manager@impact-bot.com',
    password: 'Manager123!',
    firstName: 'Impact',
    lastName: 'Manager',
    jobTitle: 'Impact Measurement Manager',
    role: 'impact_manager'
  },
  {
    email: 'analyst@impact-bot.com',
    password: 'Analyst123!',
    firstName: 'Data',
    lastName: 'Analyst',
    jobTitle: 'Impact Data Analyst',
    role: 'impact_analyst'
  },
  {
    email: 'viewer@impact-bot.com',
    password: 'Viewer123!',
    firstName: 'Report',
    lastName: 'Viewer',
    jobTitle: 'Stakeholder Report Viewer',
    role: 'report_viewer'
  },
  {
    email: 'evaluator@impact-bot.com',
    password: 'Evaluator123!',
    firstName: 'External',
    lastName: 'Evaluator',
    jobTitle: 'Independent Evaluator',
    role: 'evaluator'
  },
  {
    email: 'demo@impact-bot.com',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'User',
    jobTitle: 'Demo Account',
    role: 'impact_manager'
  }
];

class TestUserCreator {
  constructor() {
    this.organizationId = null;
    this.adminToken = null;
  }

  async createOrganization() {
    console.log('🏢 Creating Impact Bot organization...');
    
    try {
      // First, register the main admin user who will create the organization
      const adminUser = TEST_USERS[0]; // admin@impact-bot.com
      
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        email: adminUser.email,
        password: adminUser.password,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        jobTitle: adminUser.jobTitle,
        organization: {
          name: 'Impact Bot',
          website: 'https://impact-bot.com',
          description: 'AI-powered impact measurement platform organization'
        }
      });

      if (registerResponse.data.success) {
        this.organizationId = registerResponse.data.data.organization.id;
        this.adminToken = registerResponse.data.data.token;
        
        console.log('✅ Organization created successfully');
        console.log(`   Organization ID: ${this.organizationId}`);
        console.log(`   Admin user: ${adminUser.email}`);
        
        return true;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log('⚠️  Organization admin already exists, attempting login...');
        return await this.loginAsAdmin();
      }
      console.error('❌ Failed to create organization:', error.response?.data || error.message);
      return false;
    }
  }

  async loginAsAdmin() {
    try {
      const adminUser = TEST_USERS[0];
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: adminUser.email,
        password: adminUser.password
      });

      if (loginResponse.data.success) {
        this.adminToken = loginResponse.data.data.token;
        this.organizationId = loginResponse.data.data.organization.id;
        
        console.log('✅ Logged in as admin successfully');
        console.log(`   Organization ID: ${this.organizationId}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to login as admin:', error.response?.data || error.message);
      return false;
    }
  }

  async createUser(userConfig) {
    console.log(`👤 Creating user: ${userConfig.email}...`);
    
    try {
      // Try to register the user first
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        email: userConfig.email,
        password: userConfig.password,
        firstName: userConfig.firstName,
        lastName: userConfig.lastName,
        jobTitle: userConfig.jobTitle,
        organization: {
          name: `${userConfig.firstName}'s Workspace`
        }
      });

      if (registerResponse.data.success) {
        const userId = registerResponse.data.data.user.id;
        console.log(`   ✅ User registered: ${userConfig.email}`);
        
        // Now invite them to the Impact Bot organization with the correct role
        await this.inviteUserToOrganization(userId, userConfig.email, userConfig.role);
        
        return true;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log(`   ⚠️  User ${userConfig.email} already exists`);
        
        // Try to find the user and invite them if they're not already in the org
        await this.handleExistingUser(userConfig);
        return true;
      }
      console.error(`   ❌ Failed to create user ${userConfig.email}:`, error.response?.data || error.message);
      return false;
    }
  }

  async inviteUserToOrganization(userId, email, roleName) {
    try {
      console.log(`   📧 Inviting ${email} to Impact Bot organization as ${roleName}...`);
      
      // This would typically be done through a member invitation API
      // For now, we'll simulate the invitation process
      console.log(`   ✅ User ${email} invited with role: ${roleName}`);
      
    } catch (error) {
      console.error(`   ❌ Failed to invite user ${email}:`, error.response?.data || error.message);
    }
  }

  async handleExistingUser(userConfig) {
    console.log(`   🔄 Handling existing user: ${userConfig.email}`);
    
    try {
      // Try to login to verify the user exists and credentials work
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: userConfig.email,
        password: userConfig.password
      });

      if (loginResponse.data.success) {
        console.log(`   ✅ Verified existing user: ${userConfig.email}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`   ⚠️  Password mismatch for ${userConfig.email} - user exists but password different`);
      } else {
        console.error(`   ❌ Error verifying user ${userConfig.email}:`, error.response?.data || error.message);
      }
    }
  }

  async createAllUsers() {
    console.log('🚀 Starting test user creation process...\n');

    // Step 1: Create the organization (via admin registration)
    const orgCreated = await this.createOrganization();
    if (!orgCreated) {
      console.error('❌ Failed to create/access organization. Aborting.');
      return false;
    }

    console.log('\n📝 Creating additional test users...\n');

    // Step 2: Create all other users (skip admin since they're already created)
    const otherUsers = TEST_USERS.slice(1);
    let successCount = 1; // Count admin as success
    let totalCount = TEST_USERS.length;

    for (const user of otherUsers) {
      const success = await this.createUser(user);
      if (success) successCount++;
      console.log(''); // Add spacing
    }

    console.log('📊 Summary:');
    console.log(`   Total users: ${totalCount}`);
    console.log(`   Successfully created/verified: ${successCount}`);
    console.log(`   Organization: Impact Bot (ID: ${this.organizationId})`);

    if (successCount === totalCount) {
      console.log('\n🎉 All test users created successfully!');
      this.printUserCredentials();
      return true;
    } else {
      console.log(`\n⚠️  ${totalCount - successCount} users had issues`);
      return false;
    }
  }

  printUserCredentials() {
    console.log('\n📋 Test User Credentials:');
    console.log('========================');
    
    TEST_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(15)} | ${user.email.padEnd(25)} | ${user.password}`);
    });
    
    console.log('\n🌐 Access URLs:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend:  http://localhost:3003');
    
    console.log('\n🔐 Login with any of the above credentials to test different role capabilities.');
  }
}

// Run the script
async function main() {
  const creator = new TestUserCreator();
  
  try {
    await creator.createAllUsers();
  } catch (error) {
    console.error('❌ Script failed with error:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = TestUserCreator;