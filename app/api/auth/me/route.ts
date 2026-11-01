import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

function jsonResponse(
  user: unknown,
  status: number
) {
  return NextResponse.json(
    { user },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.user) {
      return jsonResponse(null, 401);
    }

    const sessionUserId = session.user.id;

    if (
      typeof sessionUserId !== 'string' ||
      !/^[a-fA-F0-9]{24}$/.test(sessionUserId)
    ) {
      session.destroy();
      return jsonResponse(null, 401);
    }

    await connectDB();

    const user = await User.findById(sessionUserId)
      .select(
        '_id name email role membershipTier profileImage isVerified'
      )
      .lean();

    if (!user) {
      session.destroy();
      return jsonResponse(null, 401);
    }

    if (
      user.role !== 'buyer' &&
      user.role !== 'artist'
    ) {
      session.destroy();
      return jsonResponse(null, 401);
    }

    session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      profileImage: user.profileImage,
    };

    await session.save();

    return jsonResponse(
      {
        ...session.user,
        isVerified: user.isVerified,
      },
      200
    );
  } catch (err) {
    console.error('[GET /api/auth/me]', err);

    return jsonResponse(null, 500);
  }
}
