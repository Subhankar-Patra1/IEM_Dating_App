import { prisma } from '../utils/prisma';
import { EloService } from './elo.service';
import { AnalyticsService } from './analytics.service';

export class ChatService {
  /**
   * Get all conversations for a user — returns matches with last message, unread count, and other user info.
   */
  static async getConversations(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        status: 'active',
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            photos: {
              where: { isPrimary: true },
              select: { photoUrl: true },
              take: 1,
            },
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            photos: {
              where: { isPrimary: true },
              select: { photoUrl: true },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            sentAt: true,
            readAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format conversations
    const conversations = matches.map((match) => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      const lastMessage = match.messages[0] || null;

      // Count unread messages (messages sent by the OTHER user that haven't been read)
      return {
        matchId: match.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatarUrl || otherUser.photos[0]?.photoUrl || null,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              sentAt: lastMessage.sentAt,
              isRead: !!lastMessage.readAt,
            }
          : null,
        createdAt: match.createdAt,
      };
    });

    // Sort by last message time (most recent first), fallback to match creation
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.sentAt?.getTime() || a.createdAt.getTime();
      const bTime = b.lastMessage?.sentAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });

    // Add unread counts in a separate query for accuracy
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            matchId: conv.matchId,
            senderId: { not: userId },
            readAt: null,
          },
        });
        return { ...conv, unreadCount };
      })
    );

    return conversationsWithUnread;
  }

  /**
   * Get paginated messages for a match. Cursor-based pagination (newest first).
   * If `since` is provided, fetches only messages newer than that timestamp (for incremental sync).
   */
  static async getMessages(matchId: string, cursor?: string, limit: number = 30, since?: string) {
    // Incremental sync: fetch only new messages since a timestamp
    if (since) {
      const newMessages = await prisma.message.findMany({
        where: {
          matchId,
          isDeleted: false,
          sentAt: { gt: new Date(since) },
        },
        orderBy: { sentAt: 'asc' },
        select: {
          id: true,
          content: true,
          senderId: true,
          sentAt: true,
          readAt: true,
          photoUrl: true,
        },
      });
      return { messages: newMessages, nextCursor: null, hasMore: false };
    }

    // Full pagination fetch
    const messages = await prisma.message.findMany({
      where: { matchId, isDeleted: false },
      orderBy: { sentAt: 'desc' },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        content: true,
        senderId: true,
        sentAt: true,
        readAt: true,
        photoUrl: true,
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      messages: data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Save a new message and return it with sender info.
   */
  static async sendMessage(senderId: string, matchId: string, content: string) {
    // Verify the sender is part of this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        status: 'active',
        OR: [
          { user1Id: senderId },
          { user2Id: senderId },
        ],
      },
    });

    if (!match) {
      throw new Error('Match not found or you are not part of this match');
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        matchId,
        content,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        sentAt: true,
        readAt: true,
        matchId: true,
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    // Track message metrics for algorithm (async, non-blocking)
    this.trackMessageMetrics(senderId, matchId).catch(() => {});

    return message;
  }

  /**
   * Track message metrics for the recommendation algorithm.
   * Called after sendMessage completes — runs asynchronously.
   */
  private static async trackMessageMetrics(senderId: string, matchId: string): Promise<void> {
    try {
      await EloService.trackMessage(senderId, matchId);
      AnalyticsService.trackMessage({ matchId, senderId });
    } catch (error) {
      // Non-critical — don't fail message sending if tracking fails
      console.error('[ChatService] Error tracking message metrics:', error);
    }
  }

  /**
   * Mark all unread messages in a match as read (for the given user, mark messages from the OTHER user).
   */
  static async markAsRead(matchId: string, userId: string) {
    try {
      const result = await prisma.message.updateMany({
        where: {
          matchId,
          senderId: { not: { equals: userId } },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
      return { markedCount: result.count };
    } catch (error) {
      console.error('[ChatService] markAsRead error:', error);
      return { markedCount: 0 };
    }
  }
}
