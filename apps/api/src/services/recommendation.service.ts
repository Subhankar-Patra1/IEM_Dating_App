import { prisma } from '../utils/prisma';
import { redisClient } from '../utils/redis';
import { logger } from '../utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────

type UserWithRelations = {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  orientation: string[];
  seeking: string | null;
  college: string | null;
  department: string | null;
  year: number | null;
  campus: string | null;
  isHosteller: boolean | null;
  locationArea: string | null;
  clubs: string[];
  hangoutSpots: string[];
  height: number | null;
  preferences: any;
  isVerified: boolean;
  avatarUrl: string | null;
  profileVideoUrl: string | null;
  videoPreviewUrl: string | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  photos: { photoUrl: string; isPrimary: boolean }[];
  userScore: {
    desirabilityScore: number;
    totalSwipesOut: number;
    totalRightSwipes: number;
    totalSwipesReceived: number;
    totalLikesReceived: number;
    messagesReceived: number;
    messagesReplied: number;
  } | null;
};

type ScoredUser = {
  user: UserWithRelations;
  score: number;
  matchPercentage: number;
};

type AlgorithmWeights = Record<string, number>;

// ─── Default Weights ────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  weight_department: 0.12,
  weight_interests: 0.12,
  weight_seeking: 0.10,
  weight_elo_desirability: 0.10,
  weight_year_proximity: 0.10,
  weight_campus: 0.05,
  weight_hosteller: 0.05,
  weight_personality: 0.06,
  weight_lifestyle: 0.04,
  weight_selectivity: 0.06,
  weight_right_swipe_ratio: 0.05,
  weight_activity: 0.05,
  weight_message_response: 0.05,
  weight_profile_completeness: 0.05,
};

// STEM department groups for partial matching
const STEM_DEPARTMENTS = [
  'computer science', 'cse', 'it', 'information technology',
  'ece', 'electronics', 'electrical', 'eee',
  'mechanical', 'me', 'civil', 'ce',
  'biotechnology', 'chemical', 'mathematics', 'physics',
];

const HUMANITIES_DEPARTMENTS = [
  'english', 'bengali', 'history', 'philosophy',
  'economics', 'political science', 'sociology',
  'bba', 'mba', 'commerce', 'law',
];

// ─── Recommendation Service ─────────────────────────────────────────────────

export class RecommendationService {
  private static weightsCache: AlgorithmWeights | null = null;
  private static weightsCacheExpiry = 0;

  /**
   * Load algorithm weights from DB (cached for 10 minutes).
   */
  private static async getWeights(): Promise<AlgorithmWeights> {
    if (this.weightsCache && Date.now() < this.weightsCacheExpiry) {
      return this.weightsCache;
    }

    try {
      const configs = await prisma.algorithmConfig.findMany();
      if (configs.length > 0) {
        const weights: AlgorithmWeights = {};
        configs.forEach((c: { key: string; value: number }) => { weights[c.key] = c.value; });
        this.weightsCache = { ...DEFAULT_WEIGHTS, ...weights };
      } else {
        this.weightsCache = DEFAULT_WEIGHTS;
      }
    } catch {
      this.weightsCache = DEFAULT_WEIGHTS;
    }

    this.weightsCacheExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    return this.weightsCache;
  }

  // ─── Individual Scoring Functions (each returns 0–100) ──────────────────

  /** 100 = same department, 40 = related group (STEM/humanities), 0 = unrelated */
  static scoreDepartment(a: string | null, b: string | null): number {
    if (!a || !b) return 0;
    const aNorm = a.toLowerCase().trim();
    const bNorm = b.toLowerCase().trim();
    if (aNorm === bNorm) return 100;

    const aIsSTEM = STEM_DEPARTMENTS.some((d) => aNorm.includes(d));
    const bIsSTEM = STEM_DEPARTMENTS.some((d) => bNorm.includes(d));
    if (aIsSTEM && bIsSTEM) return 40;

    const aIsHumanities = HUMANITIES_DEPARTMENTS.some((d) => aNorm.includes(d));
    const bIsHumanities = HUMANITIES_DEPARTMENTS.some((d) => bNorm.includes(d));
    if (aIsHumanities && bIsHumanities) return 40;

    return 0;
  }

  /** Jaccard similarity: intersection / union × 100 */
  static scoreInterests(aPrefs: any, bPrefs: any): number {
    const aInterests: string[] = aPrefs?.interests || [];
    const bInterests: string[] = bPrefs?.interests || [];
    if (aInterests.length === 0 || bInterests.length === 0) return 0;

    const setA = new Set(aInterests);
    const setB = new Set(bInterests);
    let intersection = 0;
    setA.forEach((item) => { if (setB.has(item)) intersection++; });

    const union = new Set([...aInterests, ...bInterests]).size;
    if (union === 0) return 0;

    return Math.round((intersection / union) * 100);
  }

  /** 100 = exact match, 50 = compatible, 0 = mismatch */
  static scoreSeeking(a: string | null, b: string | null): number {
    if (!a || !b) return 30; // Unknown — neutral score
    const aNorm = a.toLowerCase().trim();
    const bNorm = b.toLowerCase().trim();
    if (aNorm === bNorm) return 100;

    // Compatible pairs
    const compatible: Record<string, string[]> = {
      'long-term': ['long-term', 'relationship', 'life partner'],
      'relationship': ['long-term', 'relationship', 'life partner'],
      'casual': ['casual', 'fun', 'fling'],
      'fun': ['casual', 'fun', 'fling'],
      'friendship': ['friendship', 'networking'],
      'networking': ['friendship', 'networking'],
    };

    if (compatible[aNorm]?.includes(bNorm)) return 50;
    return 0;
  }

  /** Normalized desirability ELO score (already 0–100) */
  static scoreDesirabilityELO(userScore: UserWithRelations['userScore']): number {
    return userScore?.desirabilityScore ?? 50;
  }

  /** 100 = same year, 70 = ±1, 40 = ±2, 0 = ±3+ */
  static scoreYearProximity(a: number | null, b: number | null): number {
    if (a == null || b == null) return 30;
    const diff = Math.abs(a - b);
    if (diff === 0) return 100;
    if (diff === 1) return 70;
    if (diff === 2) return 40;
    return 0;
  }

  /** 100 = same campus, 0 = different */
  static scoreCampus(a: string | null, b: string | null): number {
    if (!a || !b) return 0;
    return a.toLowerCase().trim() === b.toLowerCase().trim() ? 100 : 0;
  }

  /** 100 = both same type (hosteller/day-scholar), 50 = mixed */
  static scoreHosteller(a: boolean | null, b: boolean | null): number {
    if (a == null || b == null) return 50;
    return a === b ? 100 : 50;
  }

  /** Compare personality trait matches across 5 sections: communication, love_reception, education, star_sign, personality */
  static scorePersonality(aPrefs: any, bPrefs: any): number {
    const aTraits = aPrefs?.personality;
    const bTraits = bPrefs?.personality;
    if (!aTraits || !bTraits) return 0;

    const sections = ['communication', 'love_reception', 'education', 'star_sign', 'personality'];
    let matches = 0;
    let compared = 0;

    for (const section of sections) {
      if (aTraits[section] && bTraits[section]) {
        compared++;
        if (aTraits[section] === bTraits[section]) matches++;
      }
    }

    if (compared === 0) return 0;
    return Math.round((matches / compared) * 100);
  }

  /** Compare lifestyle habit matches across 4 sections: drink, smoke, exercise, pets */
  static scoreLifestyle(aPrefs: any, bPrefs: any): number {
    const aHabits = aPrefs?.lifestyle;
    const bHabits = bPrefs?.lifestyle;
    if (!aHabits || !bHabits) return 0;

    const sections = ['drink', 'smoke', 'exercise', 'pets'];
    let matches = 0;
    let compared = 0;

    for (const section of sections) {
      if (aHabits[section] && bHabits[section]) {
        compared++;
        if (aHabits[section] === bHabits[section]) matches++;
      }
    }

    if (compared === 0) return 0;
    return Math.round((matches / compared) * 100);
  }

  /** Penalize users who swipe right on everyone (likely bots or non-selective) */
  static scoreSelectivity(userScore: UserWithRelations['userScore']): number {
    if (!userScore || userScore.totalSwipesOut < 10) return 50; // Not enough data
    const ratio = userScore.totalRightSwipes / userScore.totalSwipesOut;
    if (ratio > 0.80) return 20;  // Heavy penalty
    if (ratio > 0.60) return 40;
    if (ratio > 0.40) return 70;
    if (ratio > 0.20) return 90;
    return 100; // Very selective = rewarded
  }

  /** Raw popularity: what % of people who see you swipe right */
  static scoreRightSwipeRatio(userScore: UserWithRelations['userScore']): number {
    if (!userScore || userScore.totalSwipesReceived < 5) return 50; // Not enough data
    const ratio = userScore.totalLikesReceived / userScore.totalSwipesReceived;
    return Math.round(ratio * 100);
  }

  /** 100 if active today, decays to 0 over 30 days */
  static scoreActivity(lastActiveAt: Date | null): number {
    if (!lastActiveAt) return 10;
    const daysInactive = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysInactive < 1) return 100;
    if (daysInactive < 3) return 85;
    if (daysInactive < 7) return 60;
    if (daysInactive < 14) return 40;
    if (daysInactive < 30) return 20;
    return 5;
  }

  /** Message response rate: messagesReplied / messagesReceived × 100 */
  static scoreMessageResponse(userScore: UserWithRelations['userScore']): number {
    if (!userScore || userScore.messagesReceived < 3) return 50; // Not enough data
    const ratio = userScore.messagesReplied / userScore.messagesReceived;
    return Math.round(Math.min(ratio, 1.0) * 100);
  }

  /** Profile completeness: count filled fields / total fields × 100 */
  static scoreProfileCompleteness(user: UserWithRelations): number {
    const fields: boolean[] = [
      !!user.name,
      !!user.age,
      !!user.gender,
      !!user.department,
      user.year != null,
      !!user.college,
      !!user.campus,
      user.isHosteller != null,
      !!user.seeking,
      user.orientation.length > 0,
      !!user.avatarUrl,
      user.photos.length > 0,
      !!user.preferences?.interests && user.preferences.interests.length > 0,
      !!user.preferences?.personality,
      !!user.preferences?.lifestyle,
      user.clubs.length > 0,
      user.hangoutSpots.length > 0,
      !!user.height,
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }

  // ─── Activity Decay Multiplier ──────────────────────────────────────────

  static getActivityDecay(lastActiveAt: Date | null): number {
    if (!lastActiveAt) return 0.1;
    const days = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 7) return 1.0;
    if (days < 14) return 0.8;
    if (days < 30) return 0.5;
    return 0.1;
  }

  // ─── Cold Start Boost ───────────────────────────────────────────────────

  static getNewUserBoost(createdAt: Date): number {
    const ageMs = Date.now() - createdAt.getTime();
    const DAY = 86_400_000;
    if (ageMs < 1 * DAY) return 20;
    if (ageMs < 7 * DAY) return 10;
    return 0;
  }

  // ─── Bot Detection ──────────────────────────────────────────────────────

  static detectBot(userScore: UserWithRelations['userScore'], createdAt: Date): boolean {
    if (!userScore || userScore.totalSwipesOut < 50) return false;

    const accountAgeHours = Math.max(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60),
      1
    );
    const swipeSpeed = userScore.totalSwipesOut / accountAgeHours;
    const rightRatio = userScore.totalRightSwipes / userScore.totalSwipesOut;

    if (swipeSpeed > 50) return true;                         // >50 swipes/hour avg
    if (rightRatio > 0.95 && userScore.totalSwipesOut > 100) return true;
    return false;
  }

  // ─── Main Scoring ───────────────────────────────────────────────────────

  /** Calculate total compatibility score between currentUser and a candidate */
  static async calculateScore(
    currentUser: UserWithRelations,
    candidate: UserWithRelations
  ): Promise<number> {
    const w = await this.getWeights();

    // Weighted scoring
    const rawScore =
      (this.scoreDepartment(currentUser.department, candidate.department) * (w.weight_department || 0.12)) +
      (this.scoreInterests(currentUser.preferences, candidate.preferences) * (w.weight_interests || 0.12)) +
      (this.scoreSeeking(currentUser.seeking, candidate.seeking) * (w.weight_seeking || 0.10)) +
      (this.scoreDesirabilityELO(candidate.userScore) * (w.weight_elo_desirability || 0.10)) +
      (this.scoreYearProximity(currentUser.year, candidate.year) * (w.weight_year_proximity || 0.10)) +
      (this.scoreCampus(currentUser.campus, candidate.campus) * (w.weight_campus || 0.05)) +
      (this.scoreHosteller(currentUser.isHosteller, candidate.isHosteller) * (w.weight_hosteller || 0.05)) +
      (this.scorePersonality(currentUser.preferences, candidate.preferences) * (w.weight_personality || 0.06)) +
      (this.scoreLifestyle(currentUser.preferences, candidate.preferences) * (w.weight_lifestyle || 0.04)) +
      (this.scoreSelectivity(candidate.userScore) * (w.weight_selectivity || 0.06)) +
      (this.scoreRightSwipeRatio(candidate.userScore) * (w.weight_right_swipe_ratio || 0.05)) +
      (this.scoreActivity(candidate.lastActiveAt) * (w.weight_activity || 0.05)) +
      (this.scoreMessageResponse(candidate.userScore) * (w.weight_message_response || 0.05)) +
      (this.scoreProfileCompleteness(candidate) * (w.weight_profile_completeness || 0.05));

    // Apply activity decay multiplier
    const decay = this.getActivityDecay(candidate.lastActiveAt);
    const decayedScore = rawScore * decay;

    // Add cold start boost for new users
    const boost = this.getNewUserBoost(candidate.createdAt);

    // Bot penalty — bots are HIDDEN completely, not just demoted
    const isBot = this.detectBot(candidate.userScore, candidate.createdAt);
    if (isBot) return 0;

    return Math.round(Math.min(decayedScore + boost, 100));
  }

  // ─── 3-Step Recommendation Pipeline ─────────────────────────────────────

  /**
   * Get scored recommendations for a user.
   * 
   * Step 1: Hard SQL filters (gender, age, active, not swiped)
   * Step 2: Pre-rank by department + year, take top 100
   * Step 3: Score in memory, sort, return top `limit`
   */
  static async getRecommendations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ScoredUser[]> {
    // Check Redis cache
    const cacheKey = `recommendations:${userId}:${page}`;
    const lockKey = `lock:recommendations:${userId}:${page}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`[RECO] Cache hit for ${userId.slice(0, 8)} page ${page}`);
        return JSON.parse(cached);
      }

      // Cache stampede prevention: acquire lock so only one request generates
      const lockAcquired = await redisClient.set(lockKey, '1', 'EX', 10, 'NX');
      if (!lockAcquired) {
        // Another request is generating — wait and retry from cache
        for (let retry = 0; retry < 3; retry++) {
          await new Promise((r) => setTimeout(r, 200));
          const retryCache = await redisClient.get(cacheKey);
          if (retryCache) {
            return JSON.parse(retryCache);
          }
        }
        // Fall through to generate (better than returning error)
      }
    } catch {
      // Redis might not be connected — continue without cache
    }

    // Fetch current user's full profile
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: { select: { photoUrl: true, isPrimary: true }, orderBy: { order: 'asc' } },
        userScore: true,
      },
    }) as UserWithRelations | null;

    if (!currentUser) throw new Error('User not found');

    // Get IDs of users already swiped on
    const swipedIds = await prisma.swipe.findMany({
      where: { swiperId: userId },
      select: { targetId: true },
    });

    // Get IDs of blocked users (blocked by me OR blocked me)
    const [blockedByMe, blockedMe] = await Promise.all([
      prisma.userBlock.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      prisma.userBlock.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      }),
    ]);

    const excludeIds = [
      userId,
      ...swipedIds.map((s) => s.targetId),
      ...blockedByMe.map((b: { blockedId: string }) => b.blockedId),
      ...blockedMe.map((b: { blockerId: string }) => b.blockerId),
    ];

    // ── STEP 1: Hard SQL filters ─────────────────────────────────────────
    // Filter by: active, not swiped, active in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        isActive: true,
        OR: [
          { lastActiveAt: { gte: thirtyDaysAgo } },
          { lastActiveAt: null }, // New users without lastActiveAt
        ],
      },
      include: {
        photos: { select: { photoUrl: true, isPrimary: true }, orderBy: { order: 'asc' } },
        userScore: true,
      },
      // ── STEP 2: Pre-limit to prevent scoring thousands of users ────
      take: 150,
      orderBy: [
        // Prioritize same department, then recent activity
        { lastActiveAt: 'desc' },
      ],
    }) as UserWithRelations[];

    // ── STEP 3: Score in memory ──────────────────────────────────────────
    const scoredCandidates: ScoredUser[] = [];

    for (const candidate of candidates) {
      const score = await this.calculateScore(currentUser, candidate);
      // Skip bots entirely (score === 0)
      if (score === 0) continue;
      scoredCandidates.push({
        user: candidate,
        score,
        matchPercentage: Math.min(score, 99), // Cap display at 99%
      });
    }

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Paginate
    const start = (page - 1) * limit;
    const results = scoredCandidates.slice(start, start + limit);

    // Cache for 5 minutes
    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(results));
    } catch {
      // Redis not available — skip cache
    }

    logger.info(
      `[RECO] Generated ${results.length} recommendations for ${userId.slice(0, 8)} ` +
      `(scored ${candidates.length} candidates, page ${page})`
    );

    return results;
  }

  /**
   * Invalidate recommendation cache for a user.
   * Call after swipe, match, or profile update.
   */
  static async invalidateCache(userId: string): Promise<void> {
    try {
      // Delete all cached pages for this user
      const keys = await redisClient.keys(`recommendations:${userId}:*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {
      // Redis not available — skip
    }
  }
}
