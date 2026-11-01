
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    // Parse request safely.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON request body', 400);
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return jsonError('Invalid login data', 400);
    }

    const data = body as Record<string, unknown>;
    const { email, password } = data;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return jsonError(
        'Email and password are required',
        400
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return jsonError('Invalid email or password', 401);
    }

    if (password.length > 1024) {
      return jsonError('Invalid email or password', 401);
    }

    await connectDB();

    // Password is explicitly selected because the User model
    // excludes it from normal queries.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select('+password');

    // Use the same response for nonexistent accounts,
    // incorrect passwords, and Google-only accounts.
    if (!user || !user.password) {
      return jsonError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return jsonError('Invalid email or password', 401);
    }

    // Confirm the database still contains a valid account role.
    if (user.role !== 'buyer' && user.role !== 'artist') {
      return jsonError(
        'This account is not authorized to sign in',
        403
      );
    }

    // Establish the authenticated session.
    const cookieStore = await cookies();

    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      profileImage: user.profileImage,
    };

    await session.save();

    // Return only the fields the frontend needs.
    // Never return the password hash or internal user data.
    const safeUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
    };

    return NextResponse.json(
      {
        message: 'Login successful',
        user: safeUser,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('[POST /api/auth/login]', err);

    return jsonError('Login failed. Please try again.', 500);
  }
}
