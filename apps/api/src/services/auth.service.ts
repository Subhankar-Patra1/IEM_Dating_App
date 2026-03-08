import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { generateTokens } from '../utils/jwt';


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

    // Initialize UserScore for new user
    await prisma.userScore.create({
      data: { userId: user.id },
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

    if (!user.passwordHash) {
      // User registered via Phone OTP and hasn't set up an email password yet
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const jti = randomUUID();
    const { accessToken, refreshToken } = generateTokens(user.id, user.email ?? '', jti, user.role);

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

  static async findOrCreateByPhone(phone: string) {
    console.log(`[DEBUG SERVICE]: findOrCreateByPhone - phone: ${phone}`);
    let user;
    try {
      user = await prisma.user.findUnique({ where: { phone } });
    } catch (e) {
      console.error(`[DEBUG SERVICE]: Error finding user by phone:`, e);
      throw e;
    }

    if (!user) {
      console.log(`[DEBUG SERVICE]: User not found. Creating new user for phone: ${phone}`);
      try {
        // Auto-create user with phone — they can add email/details later
        user = await prisma.user.create({
          data: {
            phone,
            name: `User_${phone.slice(-4)}`,
            passwordHash: '', // No password for phone-only users
            isVerified: true, // Phone verified via OTP
          },
        });
        // Initialize UserScore for new user
        await prisma.userScore.create({
          data: { userId: user.id },
        });
        console.log(`[DEBUG SERVICE]: New user created with ID: ${user.id}`);
      } catch (e) {
        console.error(`[DEBUG SERVICE]: Error creating user:`, e);
        throw e;
      }
    } else {
      console.log(`[DEBUG SERVICE]: Existing user found with ID: ${user.id}`);
    }

    const jti = randomUUID();
    console.log(`[DEBUG SERVICE]: Generated JTI: ${jti}`);
    
    let tokens;
    try {
      tokens = generateTokens(user.id, user.email || user.phone || '', jti, user.role);
      console.log(`[DEBUG SERVICE]: Tokens generated successfully.`);
    } catch (e) {
      console.error(`[DEBUG SERVICE]: Error generating tokens:`, e);
      throw e;
    }

    try {
      await prisma.userSession.create({
        data: {
          userId: user.id,
          tokenJti: jti,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          deviceInfo: {},
        },
      });
      console.log(`[DEBUG SERVICE]: User session created in DB.`);
    } catch (e) {
      console.error(`[DEBUG SERVICE]: Error creating user session:`, e);
      throw e;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }
}
