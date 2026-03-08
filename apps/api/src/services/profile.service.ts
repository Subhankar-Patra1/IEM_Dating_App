import { prisma } from '../utils/prisma';


export class ProfileService {
  static async getProfile(userId: string) {
    return prisma.user.findUnique({
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
  }

  static async updateProfile(userId: string, data: any) {
    // Whitelist only valid Prisma/User model fields to prevent 500 errors
    const ALLOWED_FIELDS = [
      'name', 'birthday', 'age', 'gender', 'showGender',
      'orientation', 'showOrientation', 'distancePreference',
      'seeking', 'college', 'department', 'year', 'preferences',
      'campus', 'isHosteller', 'clubs', 'hangoutSpots', 'attendanceMood', 'height',
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
      }
    }

    return prisma.user.update({
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
  }
}
