import { type SessionOptions } from 'iron-session';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'artist' | 'buyer';
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  profileImage?: string;
}

export interface SessionData {
  user?: SessionUser;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.NEXTAUTH_SECRET ||
    'fallback-secret-must-be-32-chars-long!!',

  cookieName: 'unboxarts-session',

  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'lax',
  },
};