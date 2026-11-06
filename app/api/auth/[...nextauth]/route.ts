import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') {
        return false;
      }

      const googleProfile = profile as
        | {
            email?: unknown;
            email_verified?: unknown;
          }
        | undefined;

      if (googleProfile?.email_verified !== true) {
        console.error('[Google OAuth] Email verification failed');
        return false;
      }

      const email =
        typeof user.email === 'string'
          ? user.email.trim().toLowerCase()
          : '';

      const profileEmail =
        typeof googleProfile.email === 'string'
          ? googleProfile.email.trim().toLowerCase()
          : '';

      // Require a valid, matching email from both OAuth objects.
      if (
        !email ||
        !profileEmail ||
        email !== profileEmail ||
        email.length > 254
      ) {
        console.error('[Google OAuth] Invalid email information');
        return false;
      }

      try {
        await connectDB();

        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          const name =
            typeof user.name === 'string' && user.name.trim()
              ? user.name.trim().slice(0, 100)
              : email.split('@')[0].slice(0, 100);

          const profileImage =
            typeof user.image === 'string' &&
            user.image.length <= 2048
              ? user.image
              : undefined;

          try {
            dbUser = await User.create({
              name,
              email,
              profileImage,
              role: 'buyer',
              membershipTier: 'free',
              isVerified: true,
            });
          } catch (createError) {
            if (!isDuplicateKeyError(createError)) {
              throw createError;
            }

            dbUser = await User.findOne({ email });

            if (!dbUser) {
              throw createError;
            }
          }
        }

        if (
          dbUser.role !== 'buyer' &&
          dbUser.role !== 'artist' &&
          dbUser.role !== 'admin'
        ) {
          console.error('[Google OAuth] Invalid database role');
          return false;
        }

        const cookieStore = await cookies();

        const session = await getIronSession<SessionData>(
          cookieStore,
          sessionOptions
        );

        session.user = {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          membershipTier: dbUser.membershipTier || 'free',
          profileImage: dbUser.profileImage,
        };

        await session.save();

        return true;
      } catch (err) {
        console.error(
          '[Google OAuth] Sign-in failed:',
          err instanceof Error ? err.name : 'Unknown error'
        );

        return false;
      }
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
