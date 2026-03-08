import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { ApiResponse } from '../utils/ApiResponse';

export class ProfileController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const profile = await ProfileService.getProfile(userId);
      if (!profile) return res.status(404).json(ApiResponse.error('Profile not found'));
      res.status(200).json(ApiResponse.success(profile));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      console.log('Update Profile Request Body:', JSON.stringify(req.body, null, 2));
      const profile = await ProfileService.updateProfile(userId, req.body);
      res.status(200).json(ApiResponse.success(profile, 'Profile updated successfully'));
    } catch (error: any) {
      console.error('Update Profile Error:', error?.message);
      console.error('Prisma Error Code:', error?.code);
      console.error('Prisma Error Meta:', JSON.stringify(error?.meta, null, 2));
      next(error);
    }
  }
}
