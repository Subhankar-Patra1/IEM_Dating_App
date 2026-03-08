import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { prisma } from '../utils/prisma';

/**
 * Admin Controller — Provides endpoints for monitoring algorithm performance,
 * managing users, and tuning algorithm weights.
 */
export class AdminController {

  /**
   * GET /admin/metrics/overview
   * Returns high-level platform metrics: total users, matches, swipes, DAU estimate.
   */
  static async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const [totalUsers, activeUsers, totalMatches, totalSwipes, totalMessages] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({
          where: {
            isActive: true,
            lastActiveAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.match.count({ where: { status: 'active' } }),
        prisma.swipe.count(),
        prisma.message.count(),
      ]);

      const totalLikes = await prisma.swipe.count({ where: { action: 'like' } });
      const matchRate = totalLikes > 0 ? ((totalMatches / totalLikes) * 100).toFixed(1) : '0';

      res.status(200).json(ApiResponse.success({
        totalUsers,
        activeUsersToday: activeUsers,
        totalMatches,
        totalSwipes,
        totalMessages,
        totalLikes,
        matchRate: `${matchRate}%`,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/metrics/algorithm
   * Returns algorithm performance: weight configuration and score distribution.
   */
  static async getAlgorithmMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const [weights, scoreDistribution] = await Promise.all([
        prisma.algorithmConfig.findMany({ orderBy: { key: 'asc' } }),
        prisma.userScore.findMany({
          select: { desirabilityScore: true },
          orderBy: { desirabilityScore: 'desc' },
          take: 100,
        }),
      ]);

      // Calculate score buckets
      const buckets: Record<string, number> = {
        '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0,
      };

      scoreDistribution.forEach((s) => {
        const score = s.desirabilityScore;
        if (score < 20) buckets['0-20']++;
        else if (score < 40) buckets['20-40']++;
        else if (score < 60) buckets['40-60']++;
        else if (score < 80) buckets['60-80']++;
        else buckets['80-100']++;
      });

      res.status(200).json(ApiResponse.success({
        weights: weights.map((w) => ({ key: w.key, value: w.value })),
        scoreDistribution: buckets,
        totalScoredUsers: scoreDistribution.length,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/algorithm/weights
   * Update algorithm weights without redeployment.
   * Body: { weights: { weight_interests: 0.15, weight_department: 0.10, ... } }
   */
  static async updateWeights(req: Request, res: Response, next: NextFunction) {
    try {
      const { weights } = req.body;
      if (!weights || typeof weights !== 'object') {
        res.status(400).json(ApiResponse.error('Invalid weights object'));
        return;
      }

      // Validate total equals 1.0
      const total = Object.values(weights as Record<string, number>).reduce((a, b) => a + b, 0);
      if (Math.abs(total - 1.0) > 0.01) {
        res.status(400).json(ApiResponse.error(`Weights must sum to 1.0 (got ${total.toFixed(4)})`));
        return;
      }

      // Upsert each weight
      const updates = await Promise.all(
        Object.entries(weights as Record<string, number>).map(([key, value]) =>
          prisma.algorithmConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          })
        )
      );

      res.status(200).json(ApiResponse.success({
        updated: updates.length,
        weights: updates.map((w) => ({ key: w.key, value: w.value })),
      }, 'Algorithm weights updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/reported
   * Returns users with pending safety reports.
   */
  static async getReportedUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await prisma.safetyReport.findMany({
        where: { status: 'pending' },
        include: {
          reportedUser: { select: { id: true, name: true, email: true, isActive: true } },
          reporter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Count reports per user
      const reportCounts: Record<string, number> = {};
      reports.forEach((r) => {
        reportCounts[r.reportedUserId] = (reportCounts[r.reportedUserId] || 0) + 1;
      });

      res.status(200).json(ApiResponse.success({
        pendingReports: reports.length,
        reports: reports.map((r) => ({
          reportId: r.id,
          reportedUser: r.reportedUser,
          reporter: r.reporter,
          reason: r.reason,
          description: r.description,
          totalReportsOnUser: reportCounts[r.reportedUserId],
          createdAt: r.createdAt,
        })),
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/bots
   * Returns users flagged as potential bots based on swipe behavior.
   */
  static async getBotUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const suspectScores = await prisma.userScore.findMany({
        where: {
          totalSwipesOut: { gte: 50 },
        },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true, isActive: true } },
        },
        orderBy: { totalSwipesOut: 'desc' },
        take: 50,
      });

      const bots = suspectScores.filter((s) => {
        const accountAgeHours = Math.max(
          (Date.now() - s.user.createdAt.getTime()) / (1000 * 60 * 60), 1
        );
        const swipeSpeed = s.totalSwipesOut / accountAgeHours;
        const rightRatio = s.totalRightSwipes / Math.max(s.totalSwipesOut, 1);
        return swipeSpeed > 50 || (rightRatio > 0.95 && s.totalSwipesOut > 100);
      });

      res.status(200).json(ApiResponse.success({
        totalSuspects: bots.length,
        bots: bots.map((s) => ({
          user: s.user,
          totalSwipes: s.totalSwipesOut,
          rightSwipeRatio: (s.totalRightSwipes / Math.max(s.totalSwipesOut, 1)).toFixed(2),
          desirabilityScore: s.desirabilityScore,
        })),
      }));
    } catch (error) {
      next(error);
    }
  }
}
