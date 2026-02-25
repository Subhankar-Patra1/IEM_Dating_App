import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { generateTokens } from '../utils/jwt';

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: hashedPassword,
        department: data.department,
        year: data.year,
        isVerified: false,
      }
    });

    // Strip password from returned object
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const jti = randomUUID();
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, jti);

    // Save session in DB for refresh token rotation handling
    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenJti: jti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        deviceInfo: data.deviceInfo || {}
      }
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }
}
