import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function DELETE() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await Cart.findOneAndUpdate(
      { user: session.user.id },
      { $set: { items: [] } }
    );

    return NextResponse.json({
      message: 'Cart cleared successfully',
    });
  } catch (err) {
    console.error('[DELETE /api/cart/clear]', err);

    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}