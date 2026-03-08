import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export class SafetyService {
  private static readonly AUTO_HIDE_THRESHOLD = 3;

  /**
   * File a report against a user.
   * After filing, checks if the reported user has >= 3 pending reports → auto-hides.
   */
  static async fileReport(
    reporterId: string,
    data: { reportedUserId: string; matchId?: string; reason: string; description?: string }
  ) {
    const report = await prisma.safetyReport.create({
      data: {
        reporterId,
        reportedUserId: data.reportedUserId,
        matchId: data.matchId,
        reason: data.reason,
        description: data.description,
      },
    });

    // Auto-hide: check if reported user has >= threshold reports
    const reportCount = await prisma.safetyReport.count({
      where: {
        reportedUserId: data.reportedUserId,
        status: 'pending',
      },
    });

    if (reportCount >= this.AUTO_HIDE_THRESHOLD) {
      await prisma.user.update({
        where: { id: data.reportedUserId },
        data: { isActive: false },
      });
      logger.warn(
        `[SAFETY] Auto-hid user ${data.reportedUserId.slice(0, 8)} — ${reportCount} pending reports`
      );
    }

    return report;
  }

  /**
   * Get reports, optionally filtered by status.
   */
  static async getReports(status?: string, page: number = 1, limit: number = 50) {
    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      prisma.safetyReport.findMany({
        where,
        include: {
          reportedUser: { select: { id: true, name: true, email: true, isActive: true } },
          reporter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.safetyReport.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  /**
   * Resolve a report with an action (reviewed, resolved, dismissed).
   * Optionally ban the reported user.
   */
  static async resolveReport(reportId: string, action: string, banUser: boolean = false) {
    const report = await prisma.safetyReport.update({
      where: { id: reportId },
      data: { status: action },
    });

    if (banUser) {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isActive: false },
      });

      // Also resolve all other pending reports for this user
      await prisma.safetyReport.updateMany({
        where: {
          reportedUserId: report.reportedUserId,
          status: 'pending',
        },
        data: { status: 'resolved' },
      });

      logger.warn(`[SAFETY] Banned user ${report.reportedUserId.slice(0, 8)} by admin action`);
    }

    return report;
  }

  /**
   * Get report count for a specific user.
   */
  static async getReportCountByUser(userId: string) {
    const [pending, total] = await Promise.all([
      prisma.safetyReport.count({ where: { reportedUserId: userId, status: 'pending' } }),
      prisma.safetyReport.count({ where: { reportedUserId: userId } }),
    ]);
    return { pending, total };
  }
}
