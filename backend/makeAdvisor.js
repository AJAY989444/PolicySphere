const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.updateMany({
    data: { role: 'ADVISOR' }
  });
  console.log('All users made ADVISOR');
}

run().catch(console.error).finally(() => prisma.$disconnect());
