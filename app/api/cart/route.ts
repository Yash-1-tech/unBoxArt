
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import Artwork from '@/models/Artwork';
import User from '@/models/User';
import { sessionOptions, type SessionData } from '@/lib/session';

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

async function getSession() {
  const cookieStore = await cookies();

  return getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
}

async function getVerifiedBuyer(sessionUser: SessionData['user']) {
  if (!sessionUser) {
    return {
      error: jsonError('Authentication required', 401),
    };
  }

  if (sessionUser.role !== 'buyer') {
    return {
      error: jsonError(
        'Only buyers can access the cart',
        403
      ),
    };
  }

  if (
    typeof sessionUser.id !== 'string' ||
    !isValidObjectId(sessionUser.id)
  ) {
    return {
      error: jsonError('Invalid user session', 401),
    };
  }

  const buyer = await User.findById(sessionUser.id)
    .select('_id role')
    .lean();

  if (!buyer) {
    return {
      error: jsonError('Buyer account not found', 401),
    };
  }

  if (buyer.role !== 'buyer') {
    return {
      error: jsonError(
        'Only buyers can access the cart',
        403
      ),
    };
  }

  return { buyer };
}

async function populateCart(cartId: unknown) {
  return Cart.findById(cartId).populate({
    path: 'items.artwork',
    populate: {
      path: 'artist',
      select: 'name profileImage',
    },
  });
}

// GET /api/cart
export async function GET() {
  try {
    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    await connectDB();

    const result = await getVerifiedBuyer(session.user);

    if (result.error) {
      return result.error;
    }

    const buyerId = result.buyer._id;

    const cart = await Cart.findOne({
      user: buyerId,
    }).populate({
      path: 'items.artwork',
      populate: {
        path: 'artist',
        select: 'name profileImage',
      },
    });

    return NextResponse.json({
      cart: cart || {
        user: buyerId,
        items: [],
      },
    });
  } catch (err) {
    console.error('[GET /api/cart]', err);

    return jsonError('Failed to fetch cart', 500);
  }
}

// POST /api/cart
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    await connectDB();

    const result = await getVerifiedBuyer(session.user);

    if (result.error) {
      return result.error;
    }

    const buyerId = result.buyer._id;

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
      return jsonError('Invalid request body', 400);
    }

    const data = body as Record<string, unknown>;
    const { artworkId, type } = data;

    if (
      typeof artworkId !== 'string' ||
      typeof type !== 'string'
    ) {
      return jsonError(
        'Artwork ID and item type are required',
        400
      );
    }

    if (!isValidObjectId(artworkId)) {
      return jsonError('Invalid artwork ID', 400);
    }

    if (type !== 'original' && type !== 'digital_print') {
      return jsonError('Invalid item type', 400);
    }

    const artwork = await Artwork.findById(artworkId);

    if (!artwork) {
      return jsonError('Artwork not found', 404);
    }

    if (!artwork.isAvailable) {
      return jsonError(
        'This artwork is currently unavailable',
        409
      );
    }

    if (type === 'digital_print') {
      const printPrice = Number(artwork.digitalPrintPrice);

      if (
        artwork.digitalPrintPrice == null ||
        !Number.isFinite(printPrice) ||
        printPrice < 0
      ) {
        return jsonError(
          'Digital print is not available for this artwork',
          400
        );
      }
    }

    if (type === 'original') {
      const stock = Number(artwork.stock);

      if (!Number.isSafeInteger(stock) || stock < 0) {
        console.error(
          '[POST /api/cart] Invalid artwork stock',
          artworkId
        );

        return jsonError(
          'Stock information is invalid. Please contact support.',
          500
        );
      }

      if (stock < 1) {
        return jsonError(
          'This artwork is out of stock',
          409
        );
      }
    }

    let cart = await Cart.findOne({
      user: buyerId,
    });

    if (!cart) {
      cart = new Cart({
        user: buyerId,
        items: [],
      });
    }

    const normalizedArtworkId = artwork._id.toString();

    const existingItem = cart.items.some(
      (item) =>
        item.artwork.toString().toLowerCase() ===
          normalizedArtworkId.toLowerCase() &&
        item.type === type
    );

    if (existingItem) {
      return jsonError(
        'This item is already in your cart',
        409
      );
    }

    // Never accept a price or quantity from the client.
    // New cart items always start with quantity 1.
    cart.items.push({
      artwork: artwork._id,
      type,
      quantity: 1,
    });

    await cart.save();

    const populatedCart = await populateCart(cart._id);

    if (!populatedCart) {
      return jsonError(
        'Cart was saved but could not be retrieved',
        500
      );
    }

    return NextResponse.json(
      { cart: populatedCart },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/cart]', err);

    return jsonError('Failed to add item to cart', 500);
  }
}
