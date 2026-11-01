import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    // Clears the iron-session cookie.
    session.destroy();

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { headers: noStoreHeaders }
    );
  } catch (err) {
    console.error(
      '[POST /api/auth/logout]',
      err instanceof Error ? err.name : 'Unknown error'
    );

    return NextResponse.json(
      { error: 'Logout failed' },
      {
        status: 500,
        headers: noStoreHeaders,
      }
    );
  }
}
