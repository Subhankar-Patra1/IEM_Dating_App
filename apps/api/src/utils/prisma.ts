import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Defensive logging of the host (safely masked)
const dbUrl = process.env.DATABASE_URL || '';
const dbHost = dbUrl.split('@')[1]?.split('/')[0] || 'unknown';
console.log(`[PRISMA] Initializing client for host: ${dbHost}`);

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
