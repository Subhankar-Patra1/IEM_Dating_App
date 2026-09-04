import { prisma } from '../utils/prisma';
import { MediaCacheService } from './mediaCache.service';
import { transformToCdnUrl } from '../middlewares/upload.middleware';

export class ProfileService {
  static async getProfile(userId: string) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        age: true,
        gender: true,
        showGender: true,
        orientation: true,
        showOrientation: true,
        seeking: true,
        college: true,
        department: true,
        year: true,
        yearOfStudy: true,
        campus: true,
        height: true,
        degree: true,
        isHosteller: true,
        clubs: true,
        hangoutSpots: true,
        attendanceMood: true,
        distancePreference: true,
        preferences: true,
        isVerified: true,
        isActive: true,
        profileVideoUrl: true,
        videoPreviewUrl: true,
        avatarUrl: true,
        locationArea: true,
        lastActiveAt: true,
        createdAt: true,
        photos: {
          select: {
            id: true,
            photoUrl: true,
            isPrimary: true,
          },
          orderBy: { order: 'asc' },
        },
      }
    });

    if (!profile) return null;

    return {
      ...profile,
      profileVideoUrl: profile.profileVideoUrl ? transformToCdnUrl(profile.profileVideoUrl) : null,
      videoPreviewUrl: profile.videoPreviewUrl ? transformToCdnUrl(profile.videoPreviewUrl) : null,
      avatarUrl: profile.avatarUrl ? transformToCdnUrl(profile.avatarUrl) : null,
      photos: profile.photos.map(p => ({
        ...p,
        photoUrl: transformToCdnUrl(p.photoUrl)
      }))
    };
  }

  static async updateProfile(userId: string, data: any) {
    // Whitelist only valid Prisma/User model fields to prevent 500 errors
    const ALLOWED_FIELDS = [
      'name', 'birthday', 'age', 'gender', 'showGender',
      'orientation', 'showOrientation', 'distancePreference',
      'seeking', 'college', 'department', 'year', 'preferences',
      'campus', 'isHosteller', 'clubs', 'hangoutSpots', 'attendanceMood', 'height',
      'yearOfStudy',
      'locationArea',
      'profileVideoUrl',
      'videoPreviewUrl',
      'avatarUrl'
    ];

    const sanitizedData: any = {};
    Object.keys(data).forEach((key) => {
      if (ALLOWED_FIELDS.includes(key)) {
        sanitizedData[key] = data[key];
      } else if (key !== 'photos') {
        console.warn(`[ProfileService] Ignoring unknown field: "${key}"`);
      }
    });

    console.log('[ProfileService] Updating user with sanitized data:', JSON.stringify(sanitizedData, null, 2));

    // Fix: Prevent overwriting the entire preferences JSON object
    if (sanitizedData.preferences) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
      });
      
      const existingPrefs = (existingUser?.preferences as Record<string, any>) || {};
      const newPrefs = sanitizedData.preferences as Record<string, any>;
      
      // Merge new preferences into existing ones
      sanitizedData.preferences = {
        ...existingPrefs,
        ...newPrefs
      };
    }

    // Handle photos separately if provided
    if (data.photos && Array.isArray(data.photos)) {
      // Delete old photos first to replace them
      await prisma.profilePhoto.deleteMany({ where: { userId } });
      
      const photoRecords = data.photos
        .filter((url: string | null) => url !== null)
        .map((url: string, index: number) => ({
          userId,
          photoUrl: url,
          isPrimary: index === 0,
          order: index,
        }));

      if (photoRecords.length > 0) {
        await prisma.profilePhoto.createMany({ data: photoRecords });
        console.log(`[ProfileService] Created ${photoRecords.length} photo records for user ${userId.slice(0, 8)}`);
        
        // Auto-sync avatarUrl to the first photo if not explicitly provided or if it was null
        if (!sanitizedData.avatarUrl && photoRecords[0].photoUrl) {
          sanitizedData.avatarUrl = photoRecords[0].photoUrl;
          console.log(`[ProfileService] Auto-syncing avatarUrl for user ${userId.slice(0, 8)} to first photo.`);
        }
      }
    }

    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: sanitizedData,
      select: {
        id: true,
        name: true,
        birthday: true,
        age: true,
        gender: true,
        showGender: true,
        orientation: true,
        showOrientation: true,
        seeking: true,
        college: true,
        department: true,
        year: true,
        yearOfStudy: true,
        campus: true,
        isHosteller: true,
        clubs: true,
        hangoutSpots: true,
        distancePreference: true,
        preferences: true,
        isVerified: true,
        profileVideoUrl: true,
        videoPreviewUrl: true,
        avatarUrl: true,
        photos: {
          select: {
            id: true,
            photoUrl: true,
            isPrimary: true,
          },
          orderBy: { order: 'asc' },
        },
      }
    });

    // Invalidate the cache after updating profile to clear stale media URLs
    await MediaCacheService.invalidateCache(userId);

    return {
      ...updatedProfile,
      profileVideoUrl: updatedProfile.profileVideoUrl ? transformToCdnUrl(updatedProfile.profileVideoUrl) : null,
      videoPreviewUrl: updatedProfile.videoPreviewUrl ? transformToCdnUrl(updatedProfile.videoPreviewUrl) : null,
      avatarUrl: updatedProfile.avatarUrl ? transformToCdnUrl(updatedProfile.avatarUrl) : null,
      photos: updatedProfile.photos.map(p => ({
        ...p,
        photoUrl: transformToCdnUrl(p.photoUrl)
      }))
    };
  }
}
