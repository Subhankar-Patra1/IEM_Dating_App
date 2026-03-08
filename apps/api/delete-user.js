const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser() {
  const email = 'subhankar.patra2024@iem.edu.in';
  
  // Delete sessions first (foreign key)
  const sessions = await prisma.userSession.deleteMany({
    where: { user: { email } }
  });
  console.log('Deleted', sessions.count, 'session(s)');

  // Delete user
  const users = await prisma.user.deleteMany({
    where: { email }
  });
  console.log('Deleted', users.count, 'user(s)');

  await prisma.$disconnect();
}

deleteUser().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
