import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema, sendPhoneOtpSchema, verifyPhoneOtpSchema } from '../schemas/auth.schema';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/send-otp', authRateLimiter, validateRequest(sendOtpSchema), AuthController.sendOTP);
router.post('/verify-otp', authRateLimiter, validateRequest(verifyOtpSchema), AuthController.verifyOTP);

// Phone OTP routes
router.post('/send-phone-otp', authRateLimiter, validateRequest(sendPhoneOtpSchema), AuthController.sendPhoneOTP);
router.post('/verify-phone-otp', authRateLimiter, validateRequest(verifyPhoneOtpSchema), AuthController.verifyPhoneOTP);

export default router;
