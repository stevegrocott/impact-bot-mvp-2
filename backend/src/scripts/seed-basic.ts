/**
 * Basic Seed Script for Local Development
 * Creates essential test data for pitfall prevention testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedBasicData() {
  try {
    console.log('🌱 Seeding basic development data...');

    // Find or create test organization
    let organization = await prisma.organization.findFirst({
      where: { name: 'Demo Impact Organization' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Demo Impact Organization',
          description: 'A demonstration organization for testing the pitfall prevention system',
          industry: 'Social Services',
          sizeCategory: 'Medium',
          country: 'United States',
          website: 'https://demo-impact-org.com',
          settings: {
            enablePitfallWarnings: true,
            foundationFirst: true,
            warningLevel: 'detailed'
          }
        }
      });
      console.log('✅ Created organization:', organization.name);
    } else {
      console.log('ℹ️  Found existing organization:', organization.name);
    }

    // Find or create test user
    let user = await prisma.user.findUnique({
      where: { email: 'demo@impact-bot.com' }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      user = await prisma.user.create({
        data: {
          email: 'demo@impact-bot.com',
          passwordHash: hashedPassword,
          firstName: 'Demo',
          lastName: 'User',
          jobTitle: 'Program Manager',
          isActive: true
        }
      });
      console.log('✅ Created user:', user.email);
    } else {
      console.log('ℹ️  Found existing user:', user.email);
    }

    // Find or create default role
    let role = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator role with full access',
          permissions: ['read', 'write', 'admin']
        }
      });
      console.log('✅ Created admin role');
    } else {
      console.log('ℹ️  Found existing admin role');
    }

    // Check if user-organization link exists
    const existingLink = await prisma.userOrganization.findFirst({
      where: {
        userId: user.id,
        organizationId: organization.id
      }
    });

    if (!existingLink) {
      await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          roleId: role.id,
          isPrimary: true
        }
      });
      console.log('✅ Linked user to organization');
    } else {
      console.log('ℹ️  User already linked to organization');
    }

    // Check existing indicators
    const existingIndicatorCount = await prisma.irisKeyIndicator.count({
      where: {
        airtableId: {
          in: ['demo-output-1', 'demo-output-2', 'demo-outcome-1', 'demo-outcome-2', 'demo-impact-1']
        }
      }
    });

    if (existingIndicatorCount === 0) {
      // Create sample IRIS+ indicators for testing
      const indicators = await Promise.all([
        // Output indicators (for testing activity vs impact warnings)
        prisma.irisKeyIndicator.create({
          data: {
            airtableId: 'demo-output-1',
            name: 'Number of training sessions delivered',
            description: 'Count of educational or capacity-building sessions provided to beneficiaries',
            calculationGuidance: 'Count each completed training session',
            whyImportant: 'Track training delivery activities to ensure program is operating as planned',
            dataCollectionFrequency: 'monthly',
            complexityLevel: 'basic'
          }
        }),
        prisma.irisKeyIndicator.create({
          data: {
            airtableId: 'demo-output-2',
            name: 'Number of individuals trained',
            description: 'Total count of unique individuals who completed training programs',
            calculationGuidance: 'Count unique participants who completed the full program',
            whyImportant: 'Track participation in training programs to measure reach',
            dataCollectionFrequency: 'monthly',
            complexityLevel: 'basic'
          }
        }),
        
        // Outcome indicators (for demonstrating balanced portfolio)
        prisma.irisKeyIndicator.create({
          data: {
            airtableId: 'demo-outcome-1',
            name: 'Percentage of trainees demonstrating improved skills',
            description: 'Proportion of participants showing measurable skill improvement after training',
            calculationGuidance: 'Assess skills before and after training using standardized assessments',
            whyImportant: 'Measure learning effectiveness and skill development to evaluate program quality',
            dataCollectionFrequency: 'per cohort',
            complexityLevel: 'intermediate'
          }
        }),
        prisma.irisKeyIndicator.create({
          data: {
            airtableId: 'demo-outcome-2',
            name: 'Employment rate of program graduates',
            description: 'Percentage of training completers who gain employment within 6 months',
            calculationGuidance: 'Track employment status 6 months after program completion',
            whyImportant: 'Measure program effectiveness in achieving employment outcomes',
            dataCollectionFrequency: 'quarterly',
            complexityLevel: 'intermediate'
          }
        }),
        
        // Impact indicator
        prisma.irisKeyIndicator.create({
          data: {
            airtableId: 'demo-impact-1',
            name: 'Average income increase of employed graduates',
            description: 'Mean change in income for graduates who gained employment',
            calculationGuidance: 'Compare income before training with income 12 months after employment',
            whyImportant: 'Measure long-term economic impact of training programs on beneficiary wellbeing',
            dataCollectionFrequency: 'annually',
            complexityLevel: 'advanced'
          }
        })
      ]);

      console.log('✅ Created sample IRIS+ indicators:', indicators.length);
    } else {
      console.log('ℹ️  Found existing sample indicators:', existingIndicatorCount);
    }

    // Note: Theory of Change and related models commented out for basic seed
    // These would be created when proper schema is available
    console.log('ℹ️  Theory of Change models not yet in schema - skipping for basic seed');

    console.log('\n🎉 Basic seed data created successfully!');
    console.log('\n📋 Test Account Details:');
    console.log(`Email: demo@impact-bot.com`);
    console.log(`Password: demo123`);
    console.log(`Organization: ${organization.name}`);
    console.log('\n🚀 You can now test the pitfall prevention system!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedBasicData().catch((e) => {
  console.error(e);
  process.exit(1);
});