import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 401 });
    }
    if (!user.password) {
      return NextResponse.json({ error: 'Please use Google to sign in' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      profileImage: user.profileImage,
    };

    await session.save();

    const { password: _pw, ...safeUser } = user.toObject();
    return NextResponse.json({ message: 'Login successful', user: safeUser });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
