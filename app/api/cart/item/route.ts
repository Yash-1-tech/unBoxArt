import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import Artwork from '@/models/Artwork';
import { sessionOptions, type SessionData } from '@/lib/session';

async function getSession() {
  const cookieStore = await cookies();

  return getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can modify cart quantities' },
        { status: 403 }
      );
    }

    const { artworkId, type, quantity } = await req.json();

    if (!artworkId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'Artwork ID, item type, and quantity are required' },
        { status: 400 }
      );
    }

    if (type !== 'original' && type !== 'digital_print') {
      return NextResponse.json(
        { error: 'Invalid item type' },
        { status: 400 }
      );
    }

    const newQuantity = Number(quantity);

    if (
      !Number.isInteger(newQuantity) ||
      newQuantity < 1
    ) {
      return NextResponse.json(
        { error: 'Quantity must be a whole number greater than 0' },
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

    if (type === 'original' && newQuantity > artwork.stock) {
      return NextResponse.json(
        {
          error: `Only ${artwork.stock} item${
            artwork.stock === 1 ? '' : 's'
          } available`,
        },
        { status: 400 }
      );
    }

    if (
      type === 'digital_print' &&
      artwork.digitalPrintPrice == null
    ) {
      return NextResponse.json(
        { error: 'Digital print is not available for this artwork' },
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

    const item = cart.items.find(
      (item) =>
        item.artwork.toString() === artworkId &&
        item.type === type
    );

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    item.quantity = newQuantity;

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.artwork',
      populate: {
        path: 'artist',
        select: 'name profileImage',
      },
    });

    return NextResponse.json({
      cart: populatedCart,
    });
  } catch (err) {
    console.error('[PATCH /api/cart/item]', err);

    return NextResponse.json(
      { error: 'Failed to update cart quantity' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can remove cart items' },
        { status: 403 }
      );
    }

    const { artworkId, type } = await req.json();

    if (!artworkId || !type) {
      return NextResponse.json(
        { error: 'Artwork ID and item type are required' },
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