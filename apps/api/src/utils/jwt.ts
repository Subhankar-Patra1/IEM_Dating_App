import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

export const generateTokens = (userId: string, email: string, jti: string, role: string = 'user') => {
  const accessToken = jwt.sign({ sub: userId, email, role, type: 'access' }, ACCESS_SECRET, { expiresIn: '30d' });
  const refreshToken = jwt.sign({ sub: userId, email, jti, role, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '60d' });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};
