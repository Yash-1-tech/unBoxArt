import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import User from '@/models/User';
import Artwork from '@/models/Artwork';

import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

const ALLOWED_PAYMENT_METHODS = [
  'razorpay',
  'cod',
] as const;

type AllowedPaymentMethod =
  (typeof ALLOWED_PAYMENT_METHODS)[number];

type ServerOrderItem = {
  artwork: mongoose.Types.ObjectId;
  type: 'original' | 'digital_print';
  quantity: number;
  price: number;
};

type ReservedStock = {
  artwork: mongoose.Types.ObjectId;
  quantity: number;
};

type AddressData = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

class OrderRouteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OrderRouteError';
    this.status = status;
  }
}

async function getSession() {
  const cookieStore = await cookies();

  return getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

async function releaseReservedStock(
  reservations: ReservedStock[]
) {
  for (const reservation of reservations) {
    const result = await Artwork.findByIdAndUpdate(
      reservation.artwork,
      {
        $inc: {
          stock: reservation.quantity,
        },
      }
    );

    if (!result) {
      throw new Error(
        `Failed to restore stock for artwork ${reservation.artwork}`
      );
    }
  }
}

function validateShippingAddress(
  value: unknown
):
  | { address: AddressData }
  | { error: string } {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return { error: 'A valid shipping address is required' };
  }

  const input = value as Record<string, unknown>;

  const requiredFields = [
    'fullName',
    'phone',
    'addressLine1',
    'city',
    'state',
    'pincode',
    'country',
  ] as const;

  const maxLengths: Record<string, number> = {
    fullName: 120,
    phone: 30,
    addressLine1: 200,
    addressLine2: 200,
    city: 100,
    state: 100,
    pincode: 6,
    country: 100,
  };

  const address: Record<string, string> = {};

  for (const field of requiredFields) {
    const fieldValue = input[field];

    if (typeof fieldValue !== 'string') {
      return {
        error: `Shipping address field "${field}" is required`,
      };
    }

    const trimmed = fieldValue.trim();

    if (!trimmed) {
      return {
        error: `Shipping address field "${field}" is required`,
      };
    }

    if (trimmed.length > maxLengths[field]) {
      return {
        error: `Shipping address field "${field}" is too long`,
      };
    }

    address[field] = trimmed;
  }

  if (!/^\d{6}$/.test(address.pincode)) {
    return { error: 'Invalid 6-digit pincode' };
  }

  if (input.addressLine2 !== undefined &&
      input.addressLine2 !== null) {
    if (typeof input.addressLine2 !== 'string') {
      return { error: 'Invalid address line 2' };
    }

    const addressLine2 = input.addressLine2.trim();

    if (addressLine2.length > maxLengths.addressLine2) {
      return { error: 'Address line 2 is too long' };
    }

    if (addressLine2) {
      address.addressLine2 = addressLine2;
    }
  }

  return { address: address as unknown as AddressData };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    const sessionUser = session.user;

    if (sessionUser.role !== 'buyer') {
      return jsonError(
        'Only buyers can view orders',
        403
      );
    }

    if (
      typeof sessionUser.id !== 'string' ||
      !isValidObjectId(sessionUser.id)
    ) {
      return jsonError('Invalid user session', 401);
    }

    await connectDB();

    const buyer = await User.findById(sessionUser.id)
      .select('_id role')
      .lean();

    if (!buyer) {
      return jsonError('Buyer account not found', 401);
    }

    if (buyer.role !== 'buyer') {
      return jsonError(
        'Only buyers can view orders',
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedBuyerId = searchParams.get('buyerId');

    if (requestedBuyerId !== null) {
      if (!isValidObjectId(requestedBuyerId)) {
        return jsonError('Invalid buyer ID', 400);
      }

      if (
        requestedBuyerId.toLowerCase() !==
        sessionUser.id.toLowerCase()
      ) {
        return jsonError(
          'You can only view your own orders',
          403
        );
      }
    }

    const orders = await Order.find({
      buyer: buyer._id,
    })
      .populate({
        path: 'items.artwork',
        select: 'title images code medium',
        populate: {
          path: 'artist',
          select: 'name',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err) {
    console.error('[GET /api/orders]', err);

    return jsonError('Failed to fetch orders', 500);
  }
}

export async function POST(req: NextRequest) {
  const reservedOriginals: ReservedStock[] = [];

  try {
    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    const sessionUser = session.user;

    if (sessionUser.role !== 'buyer') {
      return jsonError(
        'Only buyers can place orders',
        403
      );
    }

    if (
      typeof sessionUser.id !== 'string' ||
      !isValidObjectId(sessionUser.id)
    ) {
      return jsonError('Invalid user session', 401);
    }

    await connectDB();

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

    const requestData = body as Record<string, unknown>;
    const { shippingAddress, paymentMethod } = requestData;

    if (!shippingAddress || !paymentMethod) {
      return jsonError(
        'Shipping address and payment method are required',
        400
      );
    }

    if (
      typeof paymentMethod !== 'string' ||
      !ALLOWED_PAYMENT_METHODS.includes(
        paymentMethod as AllowedPaymentMethod
      )
    ) {
      return jsonError('Invalid payment method', 400);
    }

    const addressResult =
      validateShippingAddress(shippingAddress);

    if ('error' in addressResult) {
      return jsonError(addressResult.error, 400);
    }

    const cleanAddress = addressResult.address;

    const buyer = await User.findById(sessionUser.id)
      .select('name email role')
      .lean();

    if (!buyer) {
      return jsonError('Buyer account not found', 401);
    }

    if (buyer.role !== 'buyer') {
      return jsonError(
        'Only buyer accounts can place orders',
        403
      );
    }

    const cart = await Cart.findOne({
      user: buyer._id,
    }).lean();

    if (!cart || !Array.isArray(cart.items) ||
        cart.items.length === 0) {
      return jsonError('Your cart is empty', 400);
    }

    const artworkIds = [
      ...new Set(
        cart.items.map((item) => item.artwork.toString())
      ),
    ];

    const artworkDocs = await Artwork.find({
      _id: {
        $in: artworkIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        ),
      },
    })
      .populate('artist', 'name email')
      .lean();

    const artworkMap = new Map<string, any>(
      artworkDocs.map((artwork) => [
        artwork._id.toString(),
        artwork,
      ])
    );

    const orderItems: ServerOrderItem[] = [];
    const requestedOriginalQuantities =
      new Map<string, number>();

    let subtotal = 0;
    let shippingCost = 0;

    for (const cartItem of cart.items) {
      const artwork = artworkMap.get(
        cartItem.artwork.toString()
      );

      if (!artwork) {
        return jsonError(
          'One of the artworks in your cart no longer exists',
          400
        );
      }

      if (!artwork.isAvailable) {
        return jsonError(
          `"${artwork.title}" is currently unavailable`,
          400
        );
      }

      if (
        cartItem.type !== 'original' &&
        cartItem.type !== 'digital_print'
      ) {
        return jsonError(
          'Invalid artwork type in your cart',
          400
        );
      }

      const quantity = Number(cartItem.quantity);

      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        return jsonError(
          `Invalid quantity for "${artwork.title}"`,
          400
        );
      }

      let price: number;
      let itemShipping = 0;

      if (cartItem.type === 'original') {
        const artworkId = artwork._id.toString();
        const availableStock = Number(artwork.stock);

        if (
          !Number.isSafeInteger(availableStock) ||
          availableStock < 0
        ) {
          return jsonError(
            `Stock information is invalid for "${artwork.title}". Please contact support.`,
            400
          );
        }

        const requestedTotal =
          (requestedOriginalQuantities.get(artworkId) || 0) +
          quantity;

        if (requestedTotal > availableStock) {
          return jsonError(
            `"${artwork.title}" has ${availableStock} original${
              availableStock === 1 ? '' : 's'
            } available, but your cart requests ${requestedTotal}.`,
            409
          );
        }

        requestedOriginalQuantities.set(
          artworkId,
          requestedTotal
        );

        price = Number(artwork.originalPrice);
        itemShipping = Number(artwork.shippingCost ?? 0);
      } else {
        if (artwork.digitalPrintPrice == null) {
          return jsonError(
            `Digital print is not available for "${artwork.title}"`,
            400
          );
        }

        price = Number(artwork.digitalPrintPrice);
        itemShipping = 0;
      }

      if (!Number.isFinite(price) || price < 0) {
        return jsonError(
          `Invalid price for "${artwork.title}"`,
          400
        );
      }

      if (
        !Number.isFinite(itemShipping) ||
        itemShipping < 0
      ) {
        return jsonError(
          `Invalid shipping cost for "${artwork.title}"`,
          400
        );
      }

      const lineSubtotal = price * quantity;
      const lineShipping = itemShipping * quantity;

      if (
        !Number.isFinite(lineSubtotal) ||
        !Number.isFinite(lineShipping)
      ) {
        return jsonError(
          'Order amount is outside the supported range',
          400
        );
      }

      subtotal += lineSubtotal;
      shippingCost += lineShipping;

      if (
        !Number.isFinite(subtotal) ||
        !Number.isFinite(shippingCost)
      ) {
        return jsonError(
          'Order amount is outside the supported range',
          400
        );
      }

      orderItems.push({
        artwork: artwork._id,
        type: cartItem.type,
        quantity,
        price,
      });
    }

    const discount = 0;
    const total = subtotal + shippingCost - discount;

    if (!Number.isFinite(total) || total < 0) {
      return jsonError('Invalid order total', 400);
    }

    if (
      paymentMethod === 'cod' &&
      total >= 50000
    ) {
      return jsonError(
        'Cash on Delivery is available only for orders below ₹50,000',
        400
      );
    }

    if (paymentMethod !== 'razorpay') {
      for (const item of orderItems) {
        if (item.type !== 'original') {
          continue;
        }

        const updatedArtwork =
          await Artwork.findOneAndUpdate(
            {
              _id: item.artwork,
              isAvailable: true,
              stock: { $gte: item.quantity },
            },
            {
              $inc: {
                stock: -item.quantity,
              },
            },
            {
              new: true,
            }
          );

        if (!updatedArtwork) {
          throw new OrderRouteError(
            `Insufficient stock for "${
              artworkMap.get(item.artwork.toString())?.title ||
              'one of the artworks'
            }"`,
            409
          );
        }

        reservedOriginals.push({
          artwork: item.artwork,
          quantity: item.quantity,
        });
      }
    }

    const artistNotificationStates: Array<{
      artist: mongoose.Types.ObjectId;
      status: 'pending';
      attempts: number;
    }> = [];

    const notifiedArtistIds = new Set<string>();

    for (const artwork of artworkDocs) {
      const artist = artwork.artist as {
        _id?: mongoose.Types.ObjectId | string;
      } | null;

      if (!artist?._id) {
        continue;
      }

      const artistId = artist._id.toString();

      if (notifiedArtistIds.has(artistId)) {
        continue;
      }

      notifiedArtistIds.add(artistId);

      artistNotificationStates.push({
        artist: new mongoose.Types.ObjectId(artistId),
        status: 'pending',
        attempts: 0,
      });
    }

    const order = await Order.create({
      buyer: buyer._id,
      items: orderItems,
      shippingAddress: cleanAddress,
      subtotal,
      shippingCost,
      discount,
      total,
      paymentMethod,
      paymentStatus: 'pending',
      inventoryAdjusted: reservedOriginals.length > 0,
      orderStatus: 'placed',
      emailNotifications: {
        buyerConfirmation: {
          status: 'pending',
          attempts: 0,
        },
        artistSales: artistNotificationStates,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/orders]', err);

    if (reservedOriginals.length > 0) {
      try {
        await releaseReservedStock(reservedOriginals);
      } catch (rollbackError) {
        console.error(
          'Failed to restore reserved stock:',
          rollbackError
        );
      }
    }

    if (err instanceof OrderRouteError) {
      return jsonError(err.message, err.status);
    }

    return jsonError('Failed to create order', 500);
  }
}