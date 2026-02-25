import { Router } from 'express';
import { SafetyController } from '../controllers/safety.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { reportSchema } from '../schemas/safety.schema';

const router = Router();

router.post('/report', protect, validateRequest(reportSchema), SafetyController.report);

export default router;
