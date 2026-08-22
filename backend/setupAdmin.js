const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupRoles() {
  console.log('Seeding / resetting demo accounts...');

  const demoAccounts = [
    {
      email: 'admin@policysphere.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
    },
    {
      email: 'advisor@policysphere.com',
      password: 'advisor123',
      firstName: 'Claims',
      lastName: 'Advisor',
      role: 'ADVISOR',
    },
    {
      email: 'john.doe@example.com',
      password: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
    },
  ];

  for (const account of demoAccounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email: account.email },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: account.email,
          passwordHash: passwordHash,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
        },
      });
      console.log(`✅ Created demo account: ${account.email} (${account.role})`);
    } else {
      await prisma.user.update({
        where: { email: account.email },
        data: {
          role: account.role,
          passwordHash: passwordHash,
        },
      });
      console.log(`✅ Reset demo account: ${account.email} (${account.role})`);
    }
  }
}

setupRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

