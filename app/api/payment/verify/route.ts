
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

type GatewayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
};

type GatewayRefund = {
  id: string;
  status: 'pending' | 'processed' | 'failed';
};

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

function razorpayAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API credentials are not configured');
  }

  return `Basic ${Buffer.from(
    `${keyId}:${keySecret}`
  ).toString('base64')}`;
}

async function fetchGatewayPayment(
  paymentId: string
): Promise<GatewayPayment> {
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(
      paymentId
    )}`,
    {
      method: 'GET',
      headers: {
        Authorization: razorpayAuthHeader(),
      },
      cache: 'no-store',
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      'Could not confirm the payment status with Razorpay. Please retry verification.'
    );
  }

  return data as GatewayPayment;
}

async function initiateOrRetryRefund(
  orderId: string,
  paymentId: string,
  reason: string
): Promise<NextResponse> {
  const order = await Order.findById(orderId);

  if (!order) {
    return jsonError('Order not found', 404);
  }

  if (
    order.paymentReference &&
    order.paymentReference !== paymentId
  ) {
    return jsonError(
      'This order is associated with another payment. Please contact support.',
      409
    );
  }

  if (
    order.refundStatus === 'processed' &&
    order.paymentReference === paymentId
  ) {
    return NextResponse.json(
      {
        verified: false,
        refunded: true,
        refundStatus: 'processed',
        message: 'The refund has already been processed.',
      },
      { status: 409 }
    );
  }

  const amountInPaise = Math.round(
    Number(order.total) * 100
  );

  if (
    !Number.isSafeInteger(amountInPaise) ||
    amountInPaise < 100
  ) {
    return jsonError(
      'Invalid order amount. The refund requires manual review.',
      500
    );
  }

  const idempotencyKey =
    order.refundIdempotencyKey ||
    crypto
      .createHash('sha256')
      .update(`unboxart-refund:${orderId}:${paymentId}`)
      .digest('hex')
      .slice(0, 32);

  /*
   * Do not overwrite a different recorded payment reference.
   */
  const preparedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      $or: [
        { paymentReference: { $exists: false } },
        { paymentReference: null },
        { paymentReference: paymentId },
      ],
    },
    {
      $set: {
        paymentStatus: 'paid',
        paymentReference: paymentId,
        orderStatus: 'cancelled',
        refundStatus: 'pending',
        refundIdempotencyKey: idempotencyKey,
      },
    },
    { new: true }
  );

  if (!preparedOrder) {
    return jsonError(
      'The order changed during refund preparation. Please retry verification.',
      409
    );
  }

  try {
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        paymentId
      )}/refund`,
      {
        method: 'POST',
        headers: {
          Authorization: razorpayAuthHeader(),
          'Content-Type': 'application/json',
          'X-Refund-Idempotency': idempotencyKey,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          notes: {
            order_id: orderId,
            reason: 'order_cannot_be_fulfilled',
          },
        }),
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerMessage =
        data?.error?.description ||
        'Razorpay did not confirm the refund request.';

      const outcomeUnknown =
        response.status === 409 ||
        response.status === 429 ||
        response.status >= 500;

      await Order.updateOne(
        {
          _id: orderId,
          paymentReference: paymentId,
          refundIdempotencyKey: idempotencyKey,
        },
        {
          $set: {
            paymentStatus: 'paid',
            orderStatus: 'cancelled',
            refundStatus: outcomeUnknown ? 'pending' : 'failed',
            refundError: providerMessage,
          },
        }
      );

      return NextResponse.json(
        {
          verified: false,
          refundStatus: outcomeUnknown ? 'pending' : 'failed',
          error: outcomeUnknown
            ? 'The refund request is still processing. Retry verification shortly.'
            : 'Payment succeeded, but the refund could not be confirmed. Please contact support or retry verification.',
        },
        { status: outcomeUnknown ? 409 : 502 }
      );
    }

    const refund = data as GatewayRefund;

    const refundStatus =
      refund.status === 'processed' ||
      refund.status === 'failed'
        ? refund.status
        : 'pending';

    const update: Record<string, unknown> = {
      paymentStatus:
        refundStatus === 'processed' ? 'refunded' : 'paid',
      orderStatus: 'cancelled',
      refundStatus,
    };

    if (refund.id) {
      update.refundReference = refund.id;
    }

    const updateOperation: Record<string, unknown> = {
      $set: update,
    };

    if (refundStatus !== 'failed') {
      updateOperation.$unset = { refundError: 1 };
    } else {
      (updateOperation.$set as Record<string, unknown>).refundError =
        'Razorpay reports that the refund failed. It requires retry or manual review.';
    }
    
    await Order.updateOne(
      {
        _id: orderId,
        paymentReference: paymentId,
        refundIdempotencyKey: idempotencyKey,
      },
      updateOperation
    );

    if (refundStatus === 'failed') {
      return NextResponse.json(
        {
          verified: false,
          refundStatus,
          error:
            'Payment succeeded, but Razorpay reports that the refund failed. Please contact support.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        verified: false,
        refunded: refundStatus === 'processed',
        refundStatus,
        message:
          refundStatus === 'processed'
            ? 'Stock was unavailable or the order was cancelled. The refund has been processed.'
            : 'Stock was unavailable or the order was cancelled. The refund has been initiated and is pending.',
      },
      { status: 409 }
    );
  } catch (err) {
    console.error('[Razorpay refund request]', err);

    await Order.updateOne(
      {
        _id: orderId,
        paymentReference: paymentId,
        refundIdempotencyKey: idempotencyKey,
      },
      {
        $set: {
          paymentStatus: 'paid',
          orderStatus: 'cancelled',
          refundStatus: 'pending',
          refundError:
            'Refund outcome could not be confirmed. Retry verification to safely check the same refund request.',
        },
      }
    ).catch((updateError) => {
      console.error(
        '[Persist refund error]',
        updateError
      );
    });

    return NextResponse.json(
      {
        verified: false,
        error:
          'Payment succeeded, but the refund outcome could not be confirmed. Retry verification or contact support.',
        refundStatus: 'pending',
      },
      { status: 502 }
    );
  }
}

// POST /api/payment/verify
export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return jsonError('Invalid request body', 400);
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = body as Record<string, unknown>;

    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string' ||
      typeof orderId !== 'string' ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return jsonError(
        'Missing or invalid payment verification fields',
        400
      );
    }

    if (
      !/^[a-f0-9]{64}$/i.test(razorpay_signature)
    ) {
      return jsonError(
        'Invalid payment signature format',
        400
      );
    }

    if (
      !process.env.RAZORPAY_KEY_SECRET ||
      !process.env.RAZORPAY_KEY_ID
    ) {
      return jsonError(
        'Razorpay API credentials are not configured',
        500
      );
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return jsonError('Invalid order ID', 400);
    }

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();

    const providedSignature = Buffer.from(
      razorpay_signature,
      'hex'
    );

    if (
      providedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        expectedSignature,
        providedSignature
      )
    ) {
      return jsonError(
        'Invalid payment signature',
        400
      );
    }

    await connectDB();

    const order = await Order.findById(orderId);

    if (!order) {
      return jsonError('Order not found', 404);
    }

    if (order.buyer.toString() !== session.user.id) {
      return jsonError(
        'You are not authorized to verify this order',
        403
      );
    }

    if (order.paymentMethod !== 'razorpay') {
      return jsonError(
        'This order is not configured for Razorpay',
        400
      );
    }

    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return jsonError(
        'Razorpay order does not match the Unboxarts order',
        400
      );
    }

    if (order.paymentReference === razorpay_payment_id) {
      if (order.refundStatus === 'failed') {
        return jsonError(
          'The previous refund attempt failed. Please contact support for refund reconciliation.',
          409
        );
      }

      if (order.refundStatus === 'pending') {
        return initiateOrRetryRefund(
          orderId,
          razorpay_payment_id,
          'Previously recorded refund retry'
        );
      }

      if (
        order.refundStatus === 'processed' ||
        order.paymentStatus === 'refunded'
      ) {
        return NextResponse.json(
          {
            verified: false,
            refunded: true,
            refundStatus: 'processed',
            message: 'The refund has already been processed.',
          },
          { status: 409 }
        );
      }

      if (order.paymentStatus === 'paid') {
        return NextResponse.json({
          verified: true,
          alreadyVerified: true,
          paymentId: razorpay_payment_id,
        });
      }
    }

    if (
      order.paymentStatus === 'paid' ||
      order.paymentStatus === 'refunded'
    ) {
      return jsonError(
        'This order is already associated with another payment. Please contact support.',
        409
      );
    }

    let gatewayPayment: GatewayPayment;

    try {
      gatewayPayment = await fetchGatewayPayment(
        razorpay_payment_id
      );
    } catch (err) {
      console.error('[Fetch Razorpay payment]', err);

      return jsonError(
        'Could not confirm the payment with Razorpay. Please retry verification.',
        502
      );
    }

    if (
      gatewayPayment.id !== razorpay_payment_id ||
      gatewayPayment.order_id !== razorpay_order_id
    ) {
      return jsonError(
        'The payment does not match the Razorpay order',
        400
      );
    }

    const expectedAmount = Math.round(
      Number(order.total) * 100
    );

    if (
      !Number.isSafeInteger(expectedAmount) ||
      expectedAmount <= 0 ||
      gatewayPayment.amount !== expectedAmount ||
      gatewayPayment.currency !== 'INR'
    ) {
      return jsonError(
        'The verified payment amount or currency does not match the order',
        400
      );
    }

    if (gatewayPayment.status === 'refunded') {
      return jsonError(
        'Razorpay reports that this payment is already refunded. The order needs reconciliation.',
        409
      );
    }

    if (gatewayPayment.status !== 'captured') {
      return jsonError(
        'The payment has not been captured yet. Please retry verification after payment confirmation.',
        409
      );
    }

    if (order.orderStatus === 'cancelled') {
      return initiateOrRetryRefund(
        orderId,
        razorpay_payment_id,
        'Order was cancelled before payment verification'
      );
    }

    const dbSession = await mongoose.startSession();
    let alreadyVerified = false;
    let failureReason: string | null = null;

    try {
      await dbSession.withTransaction(async () => {
        const currentOrder = await Order.findById(orderId)
          .session(dbSession);

        if (!currentOrder) {
          throw new Error('ORDER_NOT_FOUND');
        }

        if (currentOrder.paymentStatus === 'paid') {
          if (
            currentOrder.paymentReference === razorpay_payment_id
          ) {
            alreadyVerified = true;
            return;
          }

          throw new Error('ORDER_ALREADY_PAID');
        }

        if (currentOrder.orderStatus === 'cancelled') {
          throw new Error('ORDER_CANCELLED');
        }

        if (!currentOrder.inventoryAdjusted) {
          for (const item of currentOrder.items) {
            if (item.type !== 'original') {
              continue;
            }

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
              throw new Error('INSUFFICIENT_STOCK');
            }
          }
        }

        currentOrder.paymentStatus = 'paid';
        currentOrder.paymentReference = razorpay_payment_id;
        currentOrder.inventoryAdjusted = true;
        currentOrder.orderStatus = 'confirmed';

        await currentOrder.save({
          session: dbSession,
        });
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '';

      if (
        message === 'INSUFFICIENT_STOCK' ||
        message === 'ORDER_CANCELLED'
      ) {
        failureReason = message;
      } else if (message === 'ORDER_ALREADY_PAID') {
        return jsonError(
          'This order has already been paid with another payment. Please contact support.',
          409
        );
      } else if (message === 'ORDER_NOT_FOUND') {
        return jsonError('Order not found', 404);
      } else {
        throw err;
      }
    } finally {
      await dbSession.endSession();
    }

    if (alreadyVerified) {
      return NextResponse.json({
        verified: true,
        alreadyVerified: true,
        paymentId: razorpay_payment_id,
      });
    }

    if (failureReason) {
      return initiateOrRetryRefund(
        orderId,
        razorpay_payment_id,
        failureReason === 'INSUFFICIENT_STOCK'
          ? 'Original artwork stock was unavailable'
          : 'Order was cancelled before payment could be fulfilled'
      );
    }

    return NextResponse.json({
      verified: true,
      paymentId: razorpay_payment_id,
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
