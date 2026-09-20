import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function DELETE(req: NextRequest) {
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

    const body = await req.json();
    const { artworkId, type } = body;

    if (!artworkId || !type) {
      return NextResponse.json(
        { error: 'Artwork ID and item type are required' },
        { status: 400 }
      );
    }

    if (type !== 'original' && type !== 'digital_print') {
      return NextResponse.json(
        { error: 'Invalid item type' },
        { status: 400 }
      );
    }

    const cart = await Cart.findOne({
      user: session.user.id,
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.artwork.toString() === artworkId &&
          item.type === type
        )
    );

    if (cart.items.length === originalLength) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.artwork',
      populate: {
        path: 'artist',
        select: 'name profileImage',
      },
    });

    return NextResponse.json({
      message: 'Item removed from cart',
      cart: populatedCart,
    });
  } catch (err) {
    console.error('[DELETE /api/cart/item]', err);

    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}