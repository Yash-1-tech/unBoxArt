import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Artwork from '@/models/Artwork';

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

// POST /api/payment/verify
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can verify payments' },
        { status: 403 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return NextResponse.json(
        {
          error:
            'Missing payment verification fields',
        },
        { status: 400 }
      );
    }

    if (
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            'Razorpay secret is not configured',
        },
        { status: 500 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(orderId)
    ) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    /*
     * Verify the Razorpay signature first.
     */
    const signatureBody =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature =
      crypto
        .createHmac(
          'sha256',
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(signatureBody)
        .digest('hex');

    if (
      expectedSignature !==
      razorpay_signature
    ) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * Load the order and verify ownership.
     */
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (
      order.buyer.toString() !==
      session.user.id
    ) {
      return NextResponse.json(
        {
          error:
            'You are not authorized to verify this order',
        },
        { status: 403 }
      );
    }

    if (
      order.paymentMethod !==
      'razorpay'
    ) {
      return NextResponse.json(
        {
          error:
            'This order is not configured for Razorpay',
        },
        { status: 400 }
      );
    }

    /*
     * Make sure the Razorpay payment belongs to
     * the Razorpay order we created for THIS order.
     */
    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !==
        razorpay_order_id
    ) {
      return NextResponse.json(
        {
          error:
            'Razorpay order does not match the Unboxarts order',
        },
        { status: 400 }
      );
    }

    /*
     * Idempotency:
     * If this order was already successfully verified,
     * don't decrement stock a second time.
     */
    if (
      order.paymentStatus === 'paid'
    ) {
      return NextResponse.json({
        verified: true,
        alreadyVerified: true,
        paymentId:
          order.paymentReference ||
          razorpay_payment_id,
      });
    }

    /*
     * Decrement original artwork stock and mark the
     * order paid inside one MongoDB transaction.
     */
    const dbSession =
      await mongoose.startSession();

    try {
      await dbSession.withTransaction(
        async () => {
          const currentOrder =
            await Order.findById(orderId).session(
              dbSession
            );

          if (!currentOrder) {
            throw new Error(
              'Order not found'
            );
          }

          if (
            currentOrder.paymentStatus ===
            'paid'
          ) {
            return;
          }

          for (const item of currentOrder.items) {
            if (
              item.type !== 'original'
            ) {
              continue;
            }

            /*
             * Atomic stock check + decrement.
             *
             * This prevents two buyers from both
             * successfully purchasing the last item.
             */
            const updatedArtwork =
              await Artwork.findOneAndUpdate(
                {
                  _id: item.artwork,
                  isAvailable: true,
                  stock: {
                    $gte: item.quantity,
                  },
                },
                {
                  $inc: {
                    stock: -item.quantity,
                  },
                },
                {
                  new: true,
                  session: dbSession,
                }
              );

            if (!updatedArtwork) {
              throw new Error(
                'One or more original artworks no longer have sufficient stock'
              );
            }
          }

          currentOrder.paymentStatus =
            'paid';

          currentOrder.paymentReference =
            razorpay_payment_id;

          currentOrder.orderStatus =
            'confirmed';

          await currentOrder.save({
            session: dbSession,
          });
        }
      );
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      verified: true,
      paymentId:
        razorpay_payment_id,
    });
  } catch (err: unknown) {
    console.error(
      '[POST /api/payment/verify]',
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : 'Payment verification failed';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}