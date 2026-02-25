import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatService {
  static async saveMessage(senderId: string, matchId: string, content: string, photoUrl?: string) {
    const message = await prisma.message.create({
      data: {
        senderId,
        matchId,
        content,
        photoUrl
      }
    });
    return message;
  }

  static async getMessages(matchId: string) {
    return prisma.message.findMany({
      where: { matchId },
      orderBy: { sentAt: 'asc' }
    });
  }
}
