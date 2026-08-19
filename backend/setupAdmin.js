const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupRoles() {
  console.log('Reverting all users back to CUSTOMER role...');
  await prisma.user.updateMany({
    data: { role: 'CUSTOMER' }
  });

  const adminEmail = 'admin@policysphere.com';
  console.log(`Setting up Admin user: ${adminEmail}...`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'ADMIN'
      }
    });
    console.log('Admin user created successfully.');
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' }
    });
    console.log('Admin user already exists. Role set to ADMIN.');
  }
}

setupRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
