import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: { contains: 'Sayan' } },
    select: { id: true, name: true, preferences: true, seeking: true }
  });
  fs.writeFileSync('test-output2.json', JSON.stringify(user, null, 2), 'utf-8');
}

main().finally(() => prisma.$disconnect());
