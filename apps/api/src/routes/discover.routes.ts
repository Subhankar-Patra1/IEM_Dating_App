import { Router } from 'express';
import { DiscoverController } from '../controllers/discover.controller';
import { protect } from '../middlewares/auth.middleware';
import { swipeRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.get('/recommendations', protect, DiscoverController.getRecommendations);
router.post('/swipe', protect, swipeRateLimiter, DiscoverController.swipe);

export default router;
