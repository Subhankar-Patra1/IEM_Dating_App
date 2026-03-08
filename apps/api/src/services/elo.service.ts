import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * ELO Service — Handles desirability score calculations using the
 * Elo rating system adapted for dating app swipe interactions.
 * 
 * Only the TARGET user's score is updated (prevents manipulation via mass-swiping).
 */
export class EloService {
  private static readonly K_FACTOR = 32;

  /**
   * Update target user's desirability score based on a swipe action.
   * 
   * - If a HIGH-scored user likes you → big boost
   * - If a LOW-scored user likes you → small boost
   * - If a HIGH-scored user passes you → noticeable drop
   * - If a LOW-scored user passes you → minimal drop
   */
  static calculateNewScore(
    targetScore: number,
    swiperScore: number,
    action: 'like' | 'pass'
  ): number {
    const expected = 1 / (1 + Math.pow(10, (targetScore - swiperScore) / 400));

    let newScore: number;
    if (action === 'like') {
      // Target's score increases — higher-rated swipers give bigger boosts
      newScore = targetScore + this.K_FACTOR * (1 - expected);
    } else {
      // Target's score decreases slightly
      newScore = targetScore + this.K_FACTOR * (0 - expected);
    }

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, newScore));
  }

  /**
   * Process a swipe and update all UserScore metrics for both users.
   * This should be called asynchronously (from a job queue) to avoid
   * blocking the swipe response.
   */
  static async processSwipe(
    swiperId: string,
    targetId: string,
    action: 'like' | 'pass'
  ): Promise<void> {
    try {
      // Ensure both users have a UserScore record (upsert)
      const [swiperScore, targetScore] = await Promise.all([
        prisma.userScore.upsert({
          where: { userId: swiperId },
          create: { userId: swiperId },
          update: {},
        }),
        prisma.userScore.upsert({
          where: { userId: targetId },
          create: { userId: targetId },
          update: {},
        }),
      ]);

      // Calculate new desirability for target
      const newDesirability = this.calculateNewScore(
        targetScore.desirabilityScore,
        swiperScore.desirabilityScore,
        action
      );

      // Update swiper's metrics
      await prisma.userScore.update({
        where: { userId: swiperId },
        data: {
          totalSwipesOut: { increment: 1 },
          ...(action === 'like' ? { totalRightSwipes: { increment: 1 } } : {}),
        },
      });

      // Update target's metrics + desirability
      await prisma.userScore.update({
        where: { userId: targetId },
        data: {
          totalSwipesReceived: { increment: 1 },
          ...(action === 'like' ? { totalLikesReceived: { increment: 1 } } : {}),
          desirabilityScore: newDesirability,
        },
      });

      // Record full audit trail in history
      await prisma.userScoreHistory.create({
        data: {
          userId: targetId,
          scoreType: 'desirability',
          oldValue: targetScore.desirabilityScore,
          newValue: newDesirability,
          reason: `swipe_${action}`,
          metadata: {
            swiperId,
            swiperScore: swiperScore.desirabilityScore,
            timestamp: new Date().toISOString(),
          },
        },
      });

      logger.info(
        `[ELO] ${action} from ${swiperId.slice(0, 8)} (${swiperScore.desirabilityScore.toFixed(1)}) → ` +
        `${targetId.slice(0, 8)}: ${targetScore.desirabilityScore.toFixed(1)} → ${newDesirability.toFixed(1)}`
      );
    } catch (error) {
      logger.error('[ELO] Error processing swipe score update:', error);
    }
  }

  /**
   * Update message-related metrics on UserScore.
   * Called from ChatService when a message is sent.
   */
  static async trackMessage(
    senderId: string,
    matchId: string
  ): Promise<void> {
    try {
      // Find the other user in the match
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { user1Id: true, user2Id: true },
      });
      if (!match) return;

      const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;

      // Increment sender's messagesSent
      await prisma.userScore.upsert({
        where: { userId: senderId },
        create: { userId: senderId, messagesSent: 1 },
        update: { messagesSent: { increment: 1 } },
      });

      // Increment receiver's messagesReceived
      await prisma.userScore.upsert({
        where: { userId: receiverId },
        create: { userId: receiverId, messagesReceived: 1 },
        update: { messagesReceived: { increment: 1 } },
      });

      // Check if sender is replying (receiver sent a message before)
      const lastReceiverMsg = await prisma.message.findFirst({
        where: {
          matchId,
          senderId: receiverId,
        },
        orderBy: { sentAt: 'desc' },
      });

      if (lastReceiverMsg) {
        // Sender is replying — increment their messagesReplied
        await prisma.userScore.update({
          where: { userId: senderId },
          data: { messagesReplied: { increment: 1 } },
        });
      }
    } catch (error) {
      logger.error('[ELO] Error tracking message metrics:', error);
    }
  }
}
