import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { swipeSchema } from '../schemas/match.schema';

const router = Router();

router.get('/pending', protect, MatchController.getPendingMatches);
router.post('/swipe', protect, validateRequest(swipeSchema), MatchController.swipe);

export default router;
