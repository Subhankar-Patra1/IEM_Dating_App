import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

/**
 * POST /block — Block a user.
 * Prevents them from appearing in recommendations and messaging.
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const userId = (req as any).user.sub;
    const { blockedId } = req.body;

    if (!blockedId) {
      res.status(400).json(ApiResponse.error('blockedId is required'));
      return;
    }

    if (userId === blockedId) {
      res.status(400).json(ApiResponse.error('Cannot block yourself'));
      return;
    }

    // Create block (ignore if already exists)
    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId,
        },
      },
      update: {},
      create: {
        blockerId: userId,
        blockedId,
      },
    });

    // Also unmatch if they were matched
    await prisma.match.updateMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: blockedId },
          { user1Id: blockedId, user2Id: userId },
        ],
        status: 'active',
      },
      data: { status: 'blocked' },
    });

    res.status(200).json(ApiResponse.success({ blockedId }, 'User blocked successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /block/:blockedId — Unblock a user.
 */
router.delete('/:blockedId', protect, async (req, res, next) => {
  try {
    const userId = (req as any).user.sub;
    const blockedId = req.params.blockedId as string;

    await prisma.userBlock.deleteMany({
      where: {
        blockerId: userId,
        blockedId,
      },
    });

    res.status(200).json(ApiResponse.success({ blockedId }, 'User unblocked'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /block — Get list of blocked users.
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const userId = (req as any).user.sub;

    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = blocks.map((b: any) => ({
      userId: b.blocked.id,
      name: b.blocked.name,
      avatar: b.blocked.avatarUrl,
      blockedAt: b.createdAt,
    }));

    res.status(200).json(ApiResponse.success(formatted));
  } catch (error) {
    next(error);
  }
});

export default router;
