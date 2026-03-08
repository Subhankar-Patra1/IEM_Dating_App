import { redisClient } from '../utils/redis';
import { logger } from '../utils/logger';

const OTP_TTL = 300; // 5 minutes
const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_PREFIX = 'otp_rate:';
const RATE_LIMIT_WINDOW = 60; // 1 minute between sends

export class OTPService {
  /**
   * Generate a random 6-digit code
   */
  static generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check if we can send a new OTP (rate limiting)
   */
  static async canSend(email: string): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}${email.toLowerCase()}`;
    const exists = await redisClient.exists(key);
    return !exists;
  }

  /**
   * Store OTP in Redis with 5-minute TTL
   */
  static async store(email: string, code: string): Promise<void> {
    const otpKey = `${OTP_PREFIX}${email.toLowerCase()}`;
    const rateKey = `${RATE_LIMIT_PREFIX}${email.toLowerCase()}`;
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${email.toLowerCase()}`;

    // Store the code with TTL
    await redisClient.set(otpKey, code, 'EX', OTP_TTL);

    // Set rate limit (1 send per minute)
    await redisClient.set(rateKey, '1', 'EX', RATE_LIMIT_WINDOW);

    // Reset attempt counter
    await redisClient.del(attemptsKey);

    logger.info(`OTP stored for ${email}, expires in ${OTP_TTL}s`);
  }

  /**
   * Verify the OTP code
   * Returns: { valid: boolean, error?: string }
   */
  static async verify(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
    const normalizedEmail = email.toLowerCase();
    const otpKey = `${OTP_PREFIX}${normalizedEmail}`;
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${normalizedEmail}`;

    // Check attempt count
    const attempts = await redisClient.incr(attemptsKey);
    if (attempts === 1) {
      // Set expiry on first attempt
      await redisClient.expire(attemptsKey, OTP_TTL);
    }

    if (attempts > MAX_ATTEMPTS) {
      // Too many attempts — delete the OTP
      await redisClient.del(otpKey);
      await redisClient.del(attemptsKey);
      return { valid: false, error: 'Too many attempts. Please request a new code.' };
    }

    // Get stored code
    const storedCode = await redisClient.get(otpKey);

    if (!storedCode) {
      return { valid: false, error: 'Code expired. Please request a new one.' };
    }

    if (storedCode !== code) {
      const remaining = MAX_ATTEMPTS - attempts;
      return { valid: false, error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
    }

    // Success — clean up
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);

    logger.info(`OTP verified successfully for ${normalizedEmail}`);
    return { valid: true };
  }
}
