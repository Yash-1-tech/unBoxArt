import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import Artwork from '@/models/Artwork';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function GET() {
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

    const cart = await Cart.findOne({
      user: session.user.id,
    }).populate({
      path: 'items.artwork',
      populate: {
        path: 'artist',
        select: 'name profileImage',
      },
    });

    return NextResponse.json({
      cart: cart || {
        user: session.user.id,
        items: [],
      },
    });
  } catch (err) {
    console.error('[GET /api/cart]', err);

    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can add items to the cart' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const artworkId = body.artworkId;
    const type = body.type;

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

    const artwork = await Artwork.findById(artworkId);

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    if (!artwork.isAvailable) {
      return NextResponse.json(
        { error: 'This artwork is currently unavailable' },
        { status: 400 }
      );
    }

    if (type === 'digital_print' && artwork.digitalPrintPrice == null) {
      return NextResponse.json(
        { error: 'Digital print is not available for this artwork' },
        { status: 400 }
      );
    }

    if (type === 'original' && artwork.stock < 1) {
      return NextResponse.json(
        { error: 'This artwork is out of stock' },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({
      user: session.user.id,
    });

    if (!cart) {
      cart = new Cart({
        user: session.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.artwork.toString() === artworkId &&
        item.type === type
    );

    if (existingItem) {
      return NextResponse.json(
        { error: 'This item is already in your cart' },
        { status: 400 }
      );
    }

    cart.items.push({
      artwork: artwork._id,
      type,
      quantity: 1,
    });

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.artwork',
      populate: {
        path: 'artist',
        select: 'name profileImage',
      },
    });

    return NextResponse.json(
      { cart: populatedCart },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/cart]', err);

    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}