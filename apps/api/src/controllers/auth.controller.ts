import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { OTPService } from '../services/otp.service';
import { EmailService } from '../services/email.service';
import { SMSService } from '../services/sms.service';
import { ApiResponse } from '../utils/ApiResponse';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json(ApiResponse.success(user, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.login(req.body);
      res.status(200).json(ApiResponse.success(data, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  static async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const canSend = await OTPService.canSend(email);
      if (!canSend) {
        res.status(429).json(ApiResponse.error('Please wait before requesting a new code.'));
        return;
      }

      const code = OTPService.generate();
      await OTPService.store(email, code);
      await EmailService.sendOTP(email, code);

      res.status(200).json(ApiResponse.success(
        { email, expiresIn: 300 },
        'Verification code sent to your email'
      ));
    } catch (error) {
      next(error);
    }
  }

  static async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;

      const result = await OTPService.verify(email, code);

      if (!result.valid) {
        res.status(400).json(ApiResponse.error(result.error || 'Invalid code'));
        return;
      }

      res.status(200).json(ApiResponse.success(
        { email, verified: true },
        'Email verified successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  static async sendPhoneOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;

      const canSend = await OTPService.canSend(phone);
      if (!canSend) {
        res.status(429).json(ApiResponse.error('Please wait before requesting a new code.'));
        return;
      }

      const code = OTPService.generate();
      await OTPService.store(phone, code);
      await SMSService.sendOTP(phone, code);

      res.status(200).json(ApiResponse.success(
        { phone, expiresIn: 300 },
        'Verification code sent to your phone'
      ));
    } catch (error) {
      next(error);
    }
  }

  static async verifyPhoneOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code } = req.body;
      console.log(`[DEBUG VERIFY]: Attempting to verify phone OTP for: ${phone}`);

      const result = await OTPService.verify(phone, code);

      if (!result.valid) {
        console.warn(`[DEBUG VERIFY]: OTP verification failed for ${phone}: ${result.error}`);
        res.status(400).json(ApiResponse.error(result.error || 'Invalid code'));
        return;
      }

      console.log(`[DEBUG VERIFY]: OTP verified successfully for ${phone}. Fetching/Creating user...`);
      // OTP verified — find or create user and return tokens
      const data = await AuthService.findOrCreateByPhone(phone);

      console.log(`[DEBUG VERIFY]: findOrCreateByPhone successful for ${phone}. Sending response.`);
      res.status(200).json(ApiResponse.success(data, 'Phone verified successfully'));
    } catch (error) {
      console.error(`[DEBUG VERIFY]: ERROR in verifyPhoneOTP:`, error);
      next(error);
    }
  }
}
