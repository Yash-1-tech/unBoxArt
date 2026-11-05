import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import crypto from 'crypto';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

import {
  fetchGatewayPayment,
  processCapturedPayment,
} from '@/lib/razorpay-payment';

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

function isValidSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error('Razorpay API credentials are not configured');
  }

  if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(signature, 'hex');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Require an authenticated buyer.
    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    if (session.user.role !== 'buyer') {
      return jsonError(
        'Only buyers can verify payments',
        403
      );
    }

    // Recheck the user's current role in the database.
    const buyer = await User.findById(session.user.id)
      .select('_id role')
      .lean();

    if (!buyer) {
      return jsonError('Buyer account not found', 401);
    }

    if (buyer.role !== 'buyer') {
      return jsonError(
        'Only buyer accounts can verify payments',
        403
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Invalid request body', 400);
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body as Record<string, unknown>;

    if (
      typeof orderId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(orderId) ||
      typeof razorpay_order_id !== 'string' ||
      !razorpay_order_id.trim() ||
      typeof razorpay_payment_id !== 'string' ||
      !razorpay_payment_id.trim() ||
      typeof razorpay_signature !== 'string'
    ) {
      return jsonError(
        'Invalid payment verification details',
        400
      );
    }

    // Only allow the authenticated buyer to verify their own order.
    const order = await Order.findOne({
      _id: orderId,
      buyer: buyer._id,
    })
      .select(
        '_id paymentMethod razorpayOrderId'
      )
      .lean();

    if (!order) {
      return jsonError('Order not found', 404);
    }

    if (order.paymentMethod !== 'razorpay') {
      return jsonError(
        'This order is not configured for Razorpay',
        400
      );
    }

    // Verify the submitted Razorpay order against our database.
    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return jsonError(
        'Razorpay order does not match the Unboxarts order',
        400
      );
    }

    // Verify Razorpay's payment signature.
    const signatureValid = isValidSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!signatureValid) {
      return jsonError(
        'Payment signature verification failed',
        400
      );
    }

    // Independently retrieve payment details from Razorpay.
    const gatewayPayment = await fetchGatewayPayment(
      razorpay_payment_id
    );

    if (gatewayPayment.id !== razorpay_payment_id) {
      return jsonError(
        'Razorpay payment details could not be confirmed',
        400
      );
    }

    // Process captured payment, including inventory and refund handling.
    const processingResult = await processCapturedPayment(
      orderId,
      gatewayPayment
    );

    return NextResponse.json(
      processingResult.body,
      { status: processingResult.status }
    );
  } catch (error) {
    console.error('[POST /api/payment/verify]', error);

    return jsonError(
      'Payment verification could not be completed. Please retry.',
      500
    );
  }
}