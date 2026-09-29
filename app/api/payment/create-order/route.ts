import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import Razorpay from 'razorpay';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
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
        { error: 'Only buyers can make payments' },
        { status: 403 }
      );
    }

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            'Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local',
        },
        { status: 500 }
      );
    }

    const { receipt } = await req.json();

    if (!receipt) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * receipt is the MongoDB Order _id sent by checkout.
     * Never trust the amount supplied by the browser.
     */
    const mongoOrder = await Order.findById(receipt);

    if (!mongoOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    /*
     * Make sure this order belongs to the logged-in buyer.
     */
    if (
      mongoOrder.buyer.toString() !==
      session.user.sessionUser.id
    ) {
      return NextResponse.json(
        { error: 'You are not authorized to pay for this order' },
        { status: 403 }
      );
    }

    if (mongoOrder.paymentMethod !== 'razorpay') {
      return NextResponse.json(
        { error: 'This order is not configured for Razorpay' },
        { status: 400 }
      );
    }

    if (mongoOrder.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'This order has already been paid' },
        { status: 400 }
      );
    }

    /*
     * Avoid creating multiple Razorpay orders for the same
     * MongoDB order.
     */
    if (mongoOrder.razorpayOrderId) {
      return NextResponse.json({
        orderId: mongoOrder.razorpayOrderId,
        amount: Math.round(
          mongoOrder.total * 100
        ),
        currency: 'INR',
      });
    }

    const amountInPaise = Math.round(
      mongoOrder.total * 100
    );

    if (
      !Number.isInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid order total' },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: mongoOrder.orderNumber,
      });

    mongoOrder.razorpayOrderId =
      razorpayOrder.id;

    await mongoOrder.save();

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err: unknown) {
    console.error(
      '[POST /api/payment/create-order]',
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : 'Failed to create payment order';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}