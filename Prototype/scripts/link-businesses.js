const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devEmail = 'business@dev.test';
  
  // Find or create business@dev.test
  let user = await prisma.user.findUnique({ where: { email: devEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: devEmail,
        name: 'Business Dev Tester',
        role: 'BUSINESS_OWNER',
        passwordHash: 'dummy'
      }
    });
  }

  // Find all businesses
  const businesses = await prisma.businessProfile.findMany();
  
  // Link user to all businesses
  let linked = 0;
  for (const b of businesses) {
    const existing = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          userId: user.id,
          businessId: b.id
        }
      }
    });
    if (!existing) {
      await prisma.businessUser.create({
        data: {
          userId: user.id,
          businessId: b.id,
          role: 'OWNER'
        }
      });
      linked++;
    }
  }
  
  console.log(`Successfully linked ${linked} businesses to ${devEmail}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
