import { PrismaClient } from '@prisma/client';
import { redisClient } from '../utils/redis';

const prisma = new PrismaClient();

export class MatchService {
  static async getPendingMatches(userId: string) {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) throw new Error('User not found');

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        department: currentUser.department,
        isVerified: true
      },
      take: 20
    });
    return users;
  }

  static async performSwipe(userId: string, targetUserId: string, action: 'like' | 'pass') {
    const dateStr = new Date().toISOString().split('T')[0];
    const limitKey = `swipes:${userId}:${dateStr}`;
    
    const swipeCount = await redisClient.incr(limitKey);
    if (swipeCount === 1) {
      await redisClient.expire(limitKey, 86400); // 1 day expiration
    }

    if (swipeCount > 10) {
      throw new Error('Daily match limit (10) reached');
    }

    // In MVP, we just record the swipe in the database (mutual match check logic goes here)
    if (action === 'like') {
      // Logic for mutual match checking: 
      // i.e., Check if targetUserId already swiped 'like' on userId
      // If so, create active match in `matches` table
    }

    return { status: 'recorded', action, swipeCount };
  }
}
