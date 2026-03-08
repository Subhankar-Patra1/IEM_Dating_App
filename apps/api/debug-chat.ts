import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  let output = '';

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'subhankar' } },
        { name: { contains: 'Subhankar' } },
        { name: { contains: 'Priya' } },
        { email: { contains: 'priya' } },
      ],
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  output += '=== RELEVANT USERS ===\n';
  for (const u of users) {
    output += `id=${u.id}  name=${u.name}  email=${u.email}  phone=${u.phone}\n`;
  }

  const matches = await prisma.match.findMany({
    select: { id: true, user1Id: true, user2Id: true, status: true },
  });
  output += '\n=== ALL MATCHES ===\n';
  for (const m of matches) {
    output += `matchId=${m.id}  user1=${m.user1Id}  user2=${m.user2Id}  status=${m.status}\n`;
  }

  fs.writeFileSync('debug-output.txt', output);
  console.log('Output written to debug-output.txt');
}
main().catch(console.error).finally(() => prisma.$disconnect());
