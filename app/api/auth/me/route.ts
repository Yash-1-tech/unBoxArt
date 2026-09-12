import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(await cookieStore, sessionOptions);

    if (!session.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: session.user });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
