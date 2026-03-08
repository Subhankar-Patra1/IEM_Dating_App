import { logger } from '../utils/logger';

export class SMSService {
  /**
   * Send OTP via SMS.
   * Currently logs to console for development.
   * Replace with MSG91/Twilio integration for production.
   */
  static async sendOTP(phone: string, code: string): Promise<void> {
    // ─── DEV MODE: Log OTP to console ───
    logger.info(`═══════════════════════════════════════`);
    logger.info(`📱 SMS OTP for ${phone}: ${code}`);
    logger.info(`═══════════════════════════════════════`);

    // ─── PRODUCTION: Uncomment for MSG91 ───
    // const response = await fetch('https://control.msg91.com/api/v5/otp', {
    //   method: 'POST',
    //   headers: {
    //     'authkey': process.env.MSG91_AUTH_KEY!,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     template_id: process.env.MSG91_TEMPLATE_ID,
    //     mobile: phone.replace('+', ''),
    //     otp: code,
    //   }),
    // });
    // if (!response.ok) throw new Error('Failed to send SMS');
  }
}
