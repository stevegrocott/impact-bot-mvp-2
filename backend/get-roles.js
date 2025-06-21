const { PrismaClient } = require('@prisma/client');

async function getRoles() {
  const prisma = new PrismaClient();
  
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    });
    
    console.log('Available roles:');
    console.log(JSON.stringify(roles, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getRoles();