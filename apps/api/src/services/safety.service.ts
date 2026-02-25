import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SafetyService {
  static async fileReport(reporterId: string, data: { reportedUserId: string, matchId?: string, reason: string, description?: string }) {
    const report = await prisma.safetyReport.create({
      data: {
        reporterId,
        reportedUserId: data.reportedUserId,
        matchId: data.matchId,
        reason: data.reason,
        description: data.description,
      }
    });

    return report;
  }
}
