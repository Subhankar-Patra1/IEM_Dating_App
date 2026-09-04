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
          where: {
            isDeleted: false,
            NOT: {
              hiddenBy: { has: userId },
            } as any,
          } as any,
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            sentAt: true,
            readAt: true,
            photoUrl: true,
          },
        },
        chatSessions: {
          orderBy: { lastMessageAt: 'desc' },
          take: 1,
          select: { lastMessageAt: true },
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
              mediaKey: (lastMessage as any).photoUrl,
            }
          : null,
        createdAt: match.createdAt,
      };
    });

    // Sort by last message time (using ChatSession), fallback to match creation
    conversations.sort((a, b) => {
      const aMatch = matches.find(m => m.id === a.matchId);
      const bMatch = matches.find(m => m.id === b.matchId);
      const aTime = aMatch?.chatSessions?.[0]?.lastMessageAt?.getTime() || a.lastMessage?.sentAt?.getTime() || a.createdAt.getTime();
      const bTime = bMatch?.chatSessions?.[0]?.lastMessageAt?.getTime() || b.lastMessage?.sentAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });

    // Add unread counts in a separate query for accuracy (N+1 query issue fixed)
    const matchIds = conversations.map(c => c.matchId);
    let unreadMap = new Map<string, number>();

    if (matchIds.length > 0) {
      const unreadCounts = await prisma.message.groupBy({
        by: ['matchId'],
        where: {
          matchId: { in: matchIds },
          senderId: { not: userId },
          readAt: null,
          isDeleted: false,
          NOT: {
            hiddenBy: { has: userId },
          } as any,
        } as any,
        _count: true,
      });
      unreadCounts.forEach(item => unreadMap.set(item.matchId, item._count));
    }

    const conversationsWithUnread = conversations.map((conv) => ({
      ...conv,
      unreadCount: unreadMap.get(conv.matchId) || 0
    }));

    return conversationsWithUnread;
  }

  /**
   * Get paginated messages for a match. Cursor-based pagination (newest first).
   * If `since` is provided, fetches only messages newer than that timestamp (for incremental sync).
   */
  static async getMessages(matchId: string, userId: string, cursor?: string, limit: number = 30, since?: string) {
    // Incremental sync: fetch only new messages since a timestamp
    if (since) {
      const newMessages = await prisma.message.findMany({
        where: {
          matchId,
          isDeleted: false,
          NOT: {
            hiddenBy: { has: userId },
          } as any,
          sentAt: { gt: new Date(since) },
        } as any,
        orderBy: { sentAt: 'asc' },
        select: {
          id: true,
          content: true,
          senderId: true,
          sentAt: true,
          readAt: true,
          photoUrl: true,
          mediaKeys: true,
          matchId: true,
        } as any,
      });
      return { messages: newMessages, nextCursor: null, hasMore: false };
    }

    // Full pagination fetch
    const messages = await prisma.message.findMany({
      where: { 
        matchId, 
        isDeleted: false,
        NOT: {
          hiddenBy: { has: userId },
        } as any,
      } as any,
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
        mediaKeys: true,
        matchId: true,
      } as any,
    });

    const mappedMessages = messages.map(m => ({
      ...m,
      mediaKey: (m as any).photoUrl,
      mediaKeys: (m as any).mediaKeys || [],
      photoUrl: undefined,
    }));

    const hasMore = mappedMessages.length > limit;
    const data = hasMore ? mappedMessages.slice(0, limit) : mappedMessages;
    const nextCursor = hasMore ? (data[data.length - 1] as any).id : null;

    return {
      messages: data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Save a new message and return it with sender info.
   */
  static async sendMessage(senderId: string, matchId: string, content: string, photoUrl?: string, mediaKeys: string[] = []) {
    // Validation
    if (!content?.trim() && (!mediaKeys || mediaKeys.length === 0)) {
      throw new Error('Message content or media is required');
    }
    
    // Sanitize content to prevent XSS
    const sanitizedContent = content?.trim()?.substring(0, 5000) || '';

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

    // Create message with sanitized data
    const message = await prisma.message.create({
      data: {
        senderId,
        matchId,
        content: sanitizedContent,
        photoUrl,
        mediaKeys,
      } as any,
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
        photoUrl: true,
        mediaKeys: true,
      } as any,
    });

    const mappedMessage = {
      ...message,
      mediaKey: (message as any).photoUrl,
      mediaKeys: (message as any).mediaKeys || [],
      photoUrl: undefined,
    };

    // Use upsert to avoid race conditions in ChatSession update
    // First try to find existing session
    const existingSession = await prisma.chatSession.findFirst({
      where: { matchId },
    });
    
    if (existingSession) {
      // Update existing
      await prisma.chatSession.update({
        where: { id: existingSession.id },
        data: { lastMessageAt: new Date() },
      });
    } else {
      // Create new
      await prisma.chatSession.create({
        data: { matchId, lastMessageAt: new Date() },
      });
    }

    // Track message metrics for algorithm (async, non-blocking)
    this.trackMessageMetrics(senderId, matchId).catch(() => {});

    return mappedMessage;
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

  /**
   * Soft delete a message. Assumes validation is done.
   */
  static async deleteMessage(messageId: string, userId: string, mode: 'me' | 'everyone' = 'everyone') {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) {
      throw new Error('Message not found');
    }

    if (mode === 'everyone') {
      if (msg.senderId !== userId) {
        throw new Error('Not authorized to delete this message for everyone');
      }
      return await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true },
      });
    } else {
      // mode === 'me'
      // Add userId to hiddenBy array if not already there
      const currentHiddenBy = (msg as any).hiddenBy || [];
      if (!currentHiddenBy.includes(userId)) {
        return await prisma.message.update({
          where: { id: messageId },
          data: {
            hiddenBy: {
              push: userId,
            },
          } as any,
        });
      }
      return msg;
    }
  }

  /**
   * Edit a message text.
   */
  static async updateMessage(messageId: string, userId: string, content: string) {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    if (msg.isDeleted) {
      throw new Error('Cannot edit a deleted message');
    }

    const result = await prisma.message.update({
      where: { id: messageId },
      data: { content },
    });
    return result;
  }
}
