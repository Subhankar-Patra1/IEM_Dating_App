import { EloService } from './elo.service';
import { RecommendationService } from './recommendation.service';
import { logger } from '../utils/logger';

/**
 * Score Update Worker
 * 
 * Processes ELO updates asynchronously to avoid blocking swipe responses.
 * Features:
 * - Retry logic (3 attempts with exponential backoff)
 * - Dead letter array for permanently failed jobs
 * - Admin monitoring via getFailedJobs() and getQueueSize()
 */

type ScoreUpdateJob = {
  swiperId: string;
  targetId: string;
  action: 'like' | 'pass';
};

type FailedJob = {
  job: ScoreUpdateJob;
  error: string;
  failedAt: string;
  attempts: number;
};

class ScoreUpdateQueue {
  private queue: ScoreUpdateJob[] = [];
  private processing = false;
  private deadLetterQueue: FailedJob[] = [];
  private static readonly MAX_RETRIES = 3;
  private static readonly BACKOFF_BASE_MS = 1000; // 1s, 2s, 4s

  /**
   * Add a score update job to the queue.
   * Processing happens asynchronously in the background.
   */
  add(job: ScoreUpdateJob): void {
    this.queue.push(job);
    if (!this.processing) {
      this.processNext();
    }
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const job = this.queue.shift()!;

    await this.processWithRetry(job, 0);

    // Process next job (yield to event loop first)
    setImmediate(() => this.processNext());
  }

  /**
   * Process a job with retry logic and exponential backoff.
   */
  private async processWithRetry(job: ScoreUpdateJob, attempt: number): Promise<void> {
    try {
      // Process ELO update
      await EloService.processSwipe(job.swiperId, job.targetId, job.action);

      // Invalidate recommendation cache for both users
      await Promise.all([
        RecommendationService.invalidateCache(job.swiperId),
        RecommendationService.invalidateCache(job.targetId),
      ]);

      logger.info(
        `[WORKER] Processed: ${job.action} ${job.swiperId.slice(0, 8)} → ${job.targetId.slice(0, 8)}`
      );
    } catch (error: any) {
      const nextAttempt = attempt + 1;

      if (nextAttempt < ScoreUpdateQueue.MAX_RETRIES) {
        // Retry with exponential backoff
        const delayMs = ScoreUpdateQueue.BACKOFF_BASE_MS * Math.pow(2, attempt);
        logger.warn(
          `[WORKER] Attempt ${nextAttempt}/${ScoreUpdateQueue.MAX_RETRIES} failed for ` +
          `${job.swiperId.slice(0, 8)} → ${job.targetId.slice(0, 8)}, retrying in ${delayMs}ms`
        );
        await this.sleep(delayMs);
        return this.processWithRetry(job, nextAttempt);
      }

      // Max retries exhausted → move to dead letter queue
      const failedJob: FailedJob = {
        job,
        error: error?.message || 'Unknown error',
        failedAt: new Date().toISOString(),
        attempts: nextAttempt,
      };
      this.deadLetterQueue.push(failedJob);

      logger.error(
        `[WORKER] ❌ DEAD LETTER: Job failed after ${nextAttempt} attempts: ` +
        `${job.action} ${job.swiperId.slice(0, 8)} → ${job.targetId.slice(0, 8)}: ${error?.message}`
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Monitoring Methods ─────────────────────────────────────────────

  /** Get current queue size */
  get size(): number {
    return this.queue.length;
  }

  /** Get failed jobs for admin review */
  getFailedJobs(): FailedJob[] {
    return [...this.deadLetterQueue];
  }

  /** Get count of failed jobs */
  get failedCount(): number {
    return this.deadLetterQueue.length;
  }

  /** Clear dead letter queue after admin review */
  clearFailedJobs(): void {
    this.deadLetterQueue = [];
  }

  /** Retry all failed jobs */
  retryFailedJobs(): void {
    const jobs = this.deadLetterQueue.map((f) => f.job);
    this.deadLetterQueue = [];
    jobs.forEach((job) => this.add(job));
    logger.info(`[WORKER] Retrying ${jobs.length} failed jobs`);
  }
}

// Singleton instance
export const scoreUpdateQueue = new ScoreUpdateQueue();
