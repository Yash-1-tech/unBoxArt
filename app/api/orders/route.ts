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
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
} from '@/lib/email';

import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

async function getSession() {
  const cookieStore = await cookies();

  return getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
}

const ALLOWED_PAYMENT_METHODS = [
  'razorpay',
  'upi',
  'netbanking',
  'cod',
] as const;

export async function GET(req: NextRequest) {
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
        { error: 'Only buyers can view orders' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedBuyerId =
      searchParams.get('buyerId');

    // Never allow one buyer to request another buyer's orders.
    if (
      requestedBuyerId &&
      requestedBuyerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You can only view your own orders' },
        { status: 403 }
      );
    }

    const orders = await Order.find({
      buyer: session.user.id,
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

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
        { error: 'Only buyers can place orders' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      shippingAddress,
      paymentMethod,
    } = body;

    /*
     * The browser may send items/buyer information,
     * but we deliberately do NOT trust them.
     *
     * Buyer comes from the authenticated session.
     * Items, prices and quantities come from MongoDB.
     */

    if (!shippingAddress || !paymentMethod) {
      return NextResponse.json(
        {
          error:
            'Shipping address and payment method are required',
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_PAYMENT_METHODS.includes(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    const requiredAddressFields = [
      'fullName',
      'phone',
      'addressLine1',
      'city',
      'state',
      'pincode',
      'country',
    ];

    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        return NextResponse.json(
          {
            error: `Shipping address field "${field}" is required`,
          },
          { status: 400 }
        );
      }
    }

    if (
      typeof shippingAddress.pincode !== 'string' ||
      !/^\d{6}$/.test(shippingAddress.pincode)
    ) {
      return NextResponse.json(
        { error: 'Invalid 6-digit pincode' },
        { status: 400 }
      );
    }

    const buyer = await User.findById(
      session.user.id
    )
      .select('name email role')
      .lean();

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer account not found' },
        { status: 404 }
      );
    }

    if (buyer.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyer accounts can place orders' },
        { status: 403 }
      );
    }

    /*
     * Read the actual cart from MongoDB.
     */
    const cart = await Cart.findOne({
      user: session.user.id,
    }).lean();

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Your cart is empty' },
        { status: 400 }
      );
    }

    const artworkIds = [
      ...new Set(
        cart.items.map((item) =>
          item.artwork.toString()
        )
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

    const artworkMap = new Map(
      artworkDocs.map((artwork) => [
        artwork._id.toString(),
        artwork,
      ])
    );

    /*
     * Build the order items using ONLY server-side
     * artwork/cart information.
     */
    const orderItems = [];
    let subtotal = 0;
    let shippingCost = 0;

    for (const cartItem of cart.items) {
      const artwork =
        artworkMap.get(
          cartItem.artwork.toString()
        );

      if (!artwork) {
        return NextResponse.json(
          {
            error:
              'One of the artworks in your cart no longer exists',
          },
          { status: 400 }
        );
      }

      if (!artwork.isAvailable) {
        return NextResponse.json(
          {
            error: `"${artwork.title}" is currently unavailable`,
          },
          { status: 400 }
        );
      }

      const quantity = Number(cartItem.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return NextResponse.json(
          {
            error: `Invalid quantity for "${artwork.title}"`,
          },
          { status: 400 }
        );
      }

      let price = 0;
      let itemShipping = 0;

      if (cartItem.type === 'original') {
        /*
         * Re-check current physical stock.
         */
        if (quantity > artwork.stock) {
          return NextResponse.json(
            {
              error: `"${artwork.title}" only has ${artwork.stock} original${
                artwork.stock === 1 ? '' : 's'
              } available`,
            },
            { status: 400 }
          );
        }

        price = Number(
          artwork.originalPrice
        );

        itemShipping =
          Number(artwork.shippingCost) || 0;
      } else {
        /*
         * Digital prints do not consume original stock.
         */
        if (
          artwork.digitalPrintPrice == null
        ) {
          return NextResponse.json(
            {
              error: `Digital print is not available for "${artwork.title}"`,
            },
            { status: 400 }
          );
        }

        price = Number(
          artwork.digitalPrintPrice
        );

        itemShipping = 0;
      }

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          {
            error: `Invalid price for "${artwork.title}"`,
          },
          { status: 400 }
        );
      }

      const lineSubtotal =
        price * quantity;

      const lineShipping =
        itemShipping * quantity;

      subtotal += lineSubtotal;
      shippingCost += lineShipping;

      orderItems.push({
        artwork: artwork._id,
        type: cartItem.type,
        quantity,
        price,
      });
    }

    const discount = 0;
    const total =
      subtotal + shippingCost - discount;

    /*
     * Server-side COD restriction.
     */
    if (
      paymentMethod === 'cod' &&
      total >= 50000
    ) {
      return NextResponse.json(
        {
          error:
            'Cash on Delivery is available only for orders below ₹50,000',
        },
        { status: 400 }
      );
    }

    /*
     * Create the order using server-calculated data.
     */
    const order = await Order.create({
      buyer: session.user.id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1:
          shippingAddress.addressLine1,
        addressLine2:
          shippingAddress.addressLine2 || undefined,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country,
      },
      subtotal,
      shippingCost,
      discount,
      total,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'placed',
    });

    /*
     * Send emails after the order is created.
     * Email failure must never break the order.
     */
    try {
      const emailItems = orderItems.map(
        (item) => {
          const artwork =
            artworkMap.get(
              item.artwork.toString()
            );

          return {
            title:
              artwork?.title ||
              'Artwork',
            price: item.price,
            type: item.type,
          };
        }
      );

      sendOrderConfirmationEmail(
        buyer.email,
        buyer.name,
        order.orderNumber,
        emailItems,
        total
      ).catch(() => {});

      const notifiedArtists =
        new Set<string>();

      for (const artwork of artworkDocs) {
        const artist =
          artwork.artist as
            | {
                _id: mongoose.Types.ObjectId;
                name?: string;
                email?: string;
              }
            | null;

        if (
          artist &&
          artist.email &&
          !notifiedArtists.has(
            artist._id.toString()
          )
        ) {
          notifiedArtists.add(
            artist._id.toString()
          );

          sendNewOrderNotificationEmail(
            artist.email,
            artist.name || 'Artist',
            order.orderNumber,
            artwork.title,
            buyer.name,
            total
          ).catch(() => {});
        }
      }
    } catch (emailError) {
      console.error(
        'Order email error:',
        emailError
      );
    }

    return NextResponse.json(
      order,
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/orders]', err);

    const message =
      err instanceof Error
        ? err.message
        : 'Failed to create order';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}