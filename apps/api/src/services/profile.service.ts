import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProfileService {
  static async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        year: true,
        seeking: true,
        preferences: true,
        isVerified: true,
        photos: true,
      }
    });
  }

  static async updateProfile(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        department: true,
        year: true,
        seeking: true,
        preferences: true,
        isVerified: true,
      }
    });
  }
}
