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

async function getVerifiedBuyer() {
  const session = await getSession();

  if (!session.user) {
    return {
      error: jsonError('Authentication required', 401),
    };
  }

  if (session.user.role !== 'buyer') {
    return {
      error: jsonError(
        'Only buyers can modify their carts',
        403
      ),
    };
  }

  if (
    typeof session.user.id !== 'string' ||
    !isValidObjectId(session.user.id)
  ) {
    return {
      error: jsonError('Invalid user session', 401),
    };
  }

  const buyer = await User.findById(session.user.id)
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
        'Only buyers can modify their carts',
        403
      ),
    };
  }

  return {
    buyerId: buyer._id.toString(),
  };
}

async function parseRequestBody(
  req: NextRequest
): Promise<
  | { data: Record<string, unknown> }
  | { error: NextResponse }
> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return {
      error: jsonError('Invalid JSON request body', 400),
    };
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body)
  ) {
    return {
      error: jsonError('Invalid request body', 400),
    };
  }

  return {
    data: body as Record<string, unknown>,
  };
}

async function getPopulatedCart(cartId: unknown) {
  return Cart.findById(cartId).populate({
    path: 'items.artwork',
    populate: {
      path: 'artist',
      select: 'name profileImage',
    },
  });
}

// PATCH /api/cart/item
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const auth = await getVerifiedBuyer();

    if ('error' in auth) {
      return auth.error;
    }

    const parsed = await parseRequestBody(req);

    if ('error' in parsed) {
      return parsed.error;
    }

    const { artworkId, type, quantity } = parsed.data;

    if (
      typeof artworkId !== 'string' ||
      typeof type !== 'string' ||
      quantity === undefined
    ) {
      return jsonError(
        'Artwork ID, item type, and quantity are required',
        400
      );
    }

    if (!isValidObjectId(artworkId)) {
      return jsonError('Invalid artwork ID', 400);
    }

    if (type !== 'original' && type !== 'digital_print') {
      return jsonError('Invalid item type', 400);
    }

    const newQuantity = Number(quantity);

    if (
      !Number.isSafeInteger(newQuantity) ||
      newQuantity < 1
    ) {
      return jsonError(
        'Quantity must be a whole number greater than 0',
        400
      );
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

    if (type === 'original') {
      const stock = Number(artwork.stock);

      if (!Number.isSafeInteger(stock) || stock < 0) {
        console.error(
          '[PATCH /api/cart/item] Invalid stock value',
          artworkId
        );

        return jsonError(
          'Stock information is invalid. Please contact support.',
          500
        );
      }

      if (newQuantity > stock) {
        return jsonError(
          `Only ${stock} item${stock === 1 ? '' : 's'} available`,
          409
        );
      }
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

    const cart = await Cart.findOne({
      user: auth.buyerId,
    });

    if (!cart) {
      return jsonError('Cart not found', 404);
    }

    const normalizedArtworkId = artwork._id.toString();

    const item = cart.items.find(
      (cartItem) =>
        cartItem.artwork.toString().toLowerCase() ===
          normalizedArtworkId.toLowerCase() &&
        cartItem.type === type
    );

    if (!item) {
      return jsonError('Item not found in cart', 404);
    }

    item.quantity = newQuantity;

    await cart.save();

    const populatedCart = await getPopulatedCart(cart._id);

    if (!populatedCart) {
      return jsonError(
        'Cart was updated but could not be retrieved',
        500
      );
    }

    return NextResponse.json({
      cart: populatedCart,
    });
  } catch (err) {
    console.error('[PATCH /api/cart/item]', err);

    return jsonError(
      'Failed to update cart quantity',
      500
    );
  }
}

// DELETE /api/cart/item
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const auth = await getVerifiedBuyer();

    if ('error' in auth) {
      return auth.error;
    }

    const parsed = await parseRequestBody(req);

    if ('error' in parsed) {
      return parsed.error;
    }

    const { artworkId, type } = parsed.data;

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

    const cart = await Cart.findOne({
      user: auth.buyerId,
    });

    if (!cart) {
      return jsonError('Cart not found', 404);
    }

    const normalizedArtworkId = artworkId.toLowerCase();
    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.artwork.toString().toLowerCase() ===
            normalizedArtworkId &&
          item.type === type
        )
    );

    if (cart.items.length === originalLength) {
      return jsonError('Item not found in cart', 404);
    }

    await cart.save();

    const populatedCart = await getPopulatedCart(cart._id);

    if (!populatedCart) {
      return jsonError(
        'Item was removed but the cart could not be retrieved',
        500
      );
    }

    return NextResponse.json({
      message: 'Item removed from cart',
      cart: populatedCart,
    });
  } catch (err) {
    console.error('[DELETE /api/cart/item]', err);

    return jsonError(
      'Failed to remove cart item',
      500
    );
  }
}
