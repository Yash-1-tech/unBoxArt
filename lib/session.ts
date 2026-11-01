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

// Prefer a dedicated session secret.
// NEXTAUTH_SECRET remains a compatibility fallback.
const sessionPassword =
  process.env.IRON_SESSION_PASSWORD ||
  process.env.NEXTAUTH_SECRET;

if (!sessionPassword || sessionPassword.trim().length < 32) {
  throw new Error(
    'IRON_SESSION_PASSWORD or NEXTAUTH_SECRET must be configured with at least 32 characters.'
  );
}

export const sessionOptions: SessionOptions = {
  password: sessionPassword,

  cookieName: 'unboxarts-session',

  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  },
};
