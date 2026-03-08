import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: 'Too many authentication attempts, please try again later',
});

export const swipeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour window
  max: 100,                   // 100 swipes per hour
  message: 'Swipe limit reached. Please try again later.',
});
