
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Artwork from '@/models/Artwork';

import {
  processCapturedPayment,
  type GatewayPayment,
} from '@/lib/razorpay-payment';

export const runtime = 'nodejs';

type WebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: Partial<GatewayPayment>;
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        amount?: number;
        status?: string;
      };
    };
  };
};

type RefundEntity = {
  id?: string;
  payment_id?: string;
  amount?: number;
  status?: string;
};

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest();

  const receivedSignature = Buffer.from(
    signature,
    'hex'
  );

  return (
    receivedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      receivedSignature,
      expectedSignature
    )
  );
}

async function handleCapturedPayment(
  entity: Partial<GatewayPayment>
) {
  if (
    typeof entity.id !== 'string' ||
    !entity.id ||
    typeof entity.order_id !== 'string' ||
    !entity.order_id ||
    !Number.isSafeInteger(entity.amount) ||
    typeof entity.currency !== 'string' ||
    typeof entity.status !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Invalid captured payment data' },
      { status: 400 }
    );
  }

  await connectDB();

  const order = await Order.findOne({
    razorpayOrderId: entity.order_id,
  })
    .select('_id')
    .lean();

  if (!order) {
    console.error(
      'Razorpay payment webhook: no matching order',
      { razorpayOrderId: entity.order_id }
    );

    return NextResponse.json({ received: true });
  }

  const payment = entity as GatewayPayment;

  const processingResult = await processCapturedPayment(
    String(order._id),
    payment
  );

  if (processingResult.status >= 500) {
    return NextResponse.json(
      { error: 'Payment webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    received: true,
    processed: processingResult.status === 200,
    paymentResult: processingResult.body,
  });
}

/**
 * Handles a failed refund without allowing an older failed
 * event to overwrite a successfully processed refund.
 */
async function handleFailedRefund(
  refundId: string,
  paymentId: string
) {
  await connectDB();

  const result = await Order.updateOne(
    {
      paymentReference: paymentId,

      refundStatus: { $ne: 'processed' },

      $or: [
        { refundReference: { $exists: false } },
        { refundReference: null },
        { refundReference: refundId },
      ],
    },
    {
      $set: {
        refundStatus: 'failed',
        paymentStatus: 'paid',
        refundReference: refundId,
        refundError:
          'Razorpay reported that the refund failed.',
      },
    }
  );

  if (result.matchedCount === 0) {
    console.error(
      'Razorpay failed refund webhook: no matching order or refund state mismatch',
      { paymentId, refundId }
    );
  }

  return NextResponse.json({ received: true });
}

/**
 * Handles a successfully processed FULL refund.
 *
 * The refund amount must match the complete order total.
 * Artwork stock is restored transactionally and only once.
 */
async function handleProcessedRefund(
  refundId: string,
  paymentId: string,
  refundAmount: number
) {
  await connectDB();

  const dbSession = await mongoose.startSession();

  let outcome:
    | 'processed'
    | 'not_found'
    | 'amount_mismatch' = 'not_found';

  let expectedAmount = 0;

  try {
    await dbSession.withTransaction(async () => {
      const order = await Order.findOne({
        paymentReference: paymentId,

        $or: [
          { refundReference: { $exists: false } },
          { refundReference: null },
          { refundReference: refundId },
        ],
      }).session(dbSession);

      if (!order) {
        outcome = 'not_found';
        return;
      }

      expectedAmount = Math.round(
        Number(order.total) * 100
      );

      if (
        !Number.isSafeInteger(expectedAmount) ||
        expectedAmount <= 0 ||
        refundAmount !== expectedAmount
      ) {
        outcome = 'amount_mismatch';
        return;
      }

      /*
       * Restore original artwork stock only if it was
       * previously deducted and has not already been released.
       */
      if (
        order.inventoryAdjusted &&
        !order.inventoryReleasedAt
      ) {
        for (const item of order.items) {
          if (item.type !== 'original') {
            continue;
          }

          const restoredArtwork =
            await Artwork.findByIdAndUpdate(
              item.artwork,
              {
                $inc: {
                  stock: item.quantity,
                },
              },
              {
                new: true,
                session: dbSession,
              }
            );

          if (!restoredArtwork) {
            throw new Error(
              'Could not restore stock for refunded artwork'
            );
          }
        }

        order.inventoryAdjusted = false;
        order.inventoryReleasedAt = new Date();
      } else if (order.inventoryReleasedAt) {
        // Preserve the already-released inventory state.
        order.inventoryAdjusted = false;
      }

      /*
       * A full refund cancels an order that has not yet
       * progressed beyond confirmation.
       *
       * Shipped and delivered orders retain their fulfillment
       * history instead of being incorrectly marked cancelled.
       */
      if (
        order.orderStatus === 'placed' ||
        order.orderStatus === 'confirmed'
      ) {
        order.orderStatus = 'cancelled';
      }

      order.paymentStatus = 'refunded';
      order.refundStatus = 'processed';
      order.refundReference = refundId;
      order.refundError = undefined;

      await order.save({
        session: dbSession,
      });

      outcome = 'processed';
    });
  } finally {
    await dbSession.endSession();
  }

  if (outcome === 'not_found') {
    console.error(
      'Razorpay processed refund webhook: no matching order or refund state mismatch',
      { paymentId, refundId }
    );

    return NextResponse.json({ received: true });
  }

  if (outcome === 'amount_mismatch') {
    console.error(
      'Razorpay refund webhook: refund amount does not match the complete order total; manual reconciliation required',
      {
        paymentId,
        refundId,
        refundAmount,
        expectedAmount,
      }
    );

    // Acknowledge the event, but do not incorrectly cancel
    // an order for a partial or mismatched refund.
    return NextResponse.json({
      received: true,
      processed: false,
      reason: 'Refund amount requires reconciliation',
    });
  }

  return NextResponse.json({
    received: true,
    processed: true,
    refunded: true,
    orderCancelled: true,
  });
}

async function handleRefundEvent(
  event: string,
  entity: RefundEntity
) {
  const refundId = entity.id;
  const paymentId = entity.payment_id;

  if (
    typeof refundId !== 'string' ||
    !refundId ||
    typeof paymentId !== 'string' ||
    !paymentId
  ) {
    return NextResponse.json(
      { error: 'Invalid refund webhook data' },
      { status: 400 }
    );
  }

  if (event === 'refund.processed') {
    if (
      entity.status !== 'processed' ||
      !Number.isSafeInteger(entity.amount) ||
      Number(entity.amount) <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid processed refund data' },
        { status: 400 }
      );
    }

    return handleProcessedRefund(
      refundId,
      paymentId,
      Number(entity.amount)
    );
  }

  if (event === 'refund.failed') {
    if (entity.status !== 'failed') {
      return NextResponse.json(
        { error: 'Invalid failed refund data' },
        { status: 400 }
      );
    }

    return handleFailedRefund(
      refundId,
      paymentId
    );
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = request.headers.get(
      'x-razorpay-signature'
    );

    if (!secret || !signature) {
      return NextResponse.json(
        {
          error:
            'Webhook configuration or signature missing',
        },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    if (
      !verifyWebhookSignature(
        rawBody,
        signature,
        secret
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    let body: WebhookPayload;

    try {
      body = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    if (body.event === 'payment.captured') {
      const payment = body.payload?.payment?.entity;

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment data missing' },
          { status: 400 }
        );
      }

      return await handleCapturedPayment(payment);
    }

    if (
      body.event === 'refund.processed' ||
      body.event === 'refund.failed'
    ) {
      const refund = body.payload?.refund?.entity;

      if (!refund) {
        return NextResponse.json(
          { error: 'Refund data missing' },
          { status: 400 }
        );
      }

      return await handleRefundEvent(
        body.event,
        refund
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      '[Razorpay webhook processing failed]',
      error
    );

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
