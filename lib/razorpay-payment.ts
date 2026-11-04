import 'server-only';

import crypto from 'crypto';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Artwork from '@/models/Artwork';
import { dispatchOrderEmails } from '@/lib/order-email-notifications';

export interface GatewayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
}

type GatewayRefund = {
  id?: string;
  status?: string;
};

export interface RazorpayProcessingResult {
  status: number;
  body: Record<string, unknown>;
}

function result(
  status: number,
  body: Record<string, unknown>
): RazorpayProcessingResult {
  return { status, body };
}

export function razorpayAuthHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay API credentials are not configured'
    );
  }

  return `Basic ${Buffer.from(
    `${keyId}:${keySecret}`
  ).toString('base64')}`;
}

export async function fetchGatewayPayment(
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

export async function initiateOrRetryRefund(
  orderId: string,
  paymentId: string
): Promise<RazorpayProcessingResult> {
  const order = await Order.findById(orderId);

  if (!order) {
    return result(404, {
      error: 'Order not found',
    });
  }

  if (
    order.paymentReference &&
    order.paymentReference !== paymentId
  ) {
    return result(409, {
      error:
        'This order is associated with another payment. Please contact support.',
    });
  }

  if (
    order.refundStatus === 'processed' &&
    order.paymentReference === paymentId
  ) {
    return result(409, {
      verified: false,
      refunded: true,
      refundStatus: 'processed',
      message: 'The refund has already been processed.',
    });
  }

  const amountInPaise = Math.round(
    Number(order.total) * 100
  );

  if (
    !Number.isSafeInteger(amountInPaise) ||
    amountInPaise < 100
  ) {
    return result(500, {
      error:
        'Invalid order amount. The refund requires manual review.',
    });
  }

  const idempotencyKey =
    order.refundIdempotencyKey ||
    crypto
      .createHash('sha256')
      .update(`unboxart-refund:${orderId}:${paymentId}`)
      .digest('hex')
      .slice(0, 32);

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
    return result(409, {
      error:
        'The order changed during refund preparation. Please retry verification.',
    });
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
            refundStatus: outcomeUnknown
              ? 'pending'
              : 'failed',
            refundError: providerMessage,
          },
        }
      );

      return result(outcomeUnknown ? 409 : 502, {
        verified: false,
        refundStatus: outcomeUnknown
          ? 'pending'
          : 'failed',
        error: outcomeUnknown
          ? 'The refund request is still processing. Retry verification shortly.'
          : 'Payment succeeded, but the refund could not be confirmed. Please contact support or retry verification.',
      });
    }

    const refund = data as GatewayRefund;

    const refundStatus =
      refund.status === 'processed' ||
      refund.status === 'failed'
        ? refund.status
        : 'pending';

    const update: Record<string, unknown> = {
      paymentStatus:
        refundStatus === 'processed'
          ? 'refunded'
          : 'paid',
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
      updateOperation.$unset = {
        refundError: 1,
      };
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
      return result(502, {
        verified: false,
        refundStatus,
        error:
          'Payment succeeded, but Razorpay reports that the refund failed. Please contact support.',
      });
    }

    return result(409, {
      verified: false,
      refunded: refundStatus === 'processed',
      refundStatus,
      message:
        refundStatus === 'processed'
          ? 'Stock was unavailable or the order was cancelled. The refund has been processed.'
          : 'Stock was unavailable or the order was cancelled. The refund has been initiated and is pending.',
    });
  } catch (error) {
    console.error('[Razorpay refund request]', error);

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

    return result(502, {
      verified: false,
      error:
        'Payment succeeded, but the refund outcome could not be confirmed. Retry verification or contact support.',
      refundStatus: 'pending',
    });
  }
}

export async function processCapturedPayment(
  orderId: string,
  payment: GatewayPayment
): Promise<RazorpayProcessingResult> {
  await connectDB();

  const order = await Order.findById(orderId);

  if (!order) {
    return result(404, {
      error: 'Order not found',
    });
  }

  if (order.paymentMethod !== 'razorpay') {
    return result(400, {
      error: 'This order is not configured for Razorpay',
    });
  }

  if (
    !order.razorpayOrderId ||
    order.razorpayOrderId !== payment.order_id
  ) {
    return result(400, {
      error: 'Razorpay order does not match the Unboxarts order',
    });
  }

  if (
    typeof payment.id !== 'string' ||
    !payment.id ||
    typeof payment.order_id !== 'string' ||
    !Number.isSafeInteger(payment.amount)
  ) {
    return result(400, {
      error: 'Invalid Razorpay payment data',
    });
  }

  if (order.paymentReference === payment.id) {
    if (order.refundStatus === 'failed') {
      return result(409, {
        error:
          'The previous refund attempt failed. Please contact support for refund reconciliation.',
      });
    }

    if (order.refundStatus === 'pending') {
      return initiateOrRetryRefund(orderId, payment.id);
    }

    if (
      order.refundStatus === 'processed' ||
      order.paymentStatus === 'refunded'
    ) {
      return result(409, {
        verified: false,
        refunded: true,
        refundStatus: 'processed',
        message: 'The refund has already been processed.',
      });
    }

    if (order.paymentStatus === 'paid') {
      await dispatchOrderEmails(orderId);

      return result(200, {
        verified: true,
        alreadyVerified: true,
        paymentId: payment.id,
      });
    }
  }

  if (
    order.paymentStatus === 'paid' ||
    order.paymentStatus === 'refunded'
  ) {
    return result(409, {
      error:
        'This order is already associated with another payment. Please contact support.',
    });
  }

  const expectedAmount = Math.round(
    Number(order.total) * 100
  );

  if (
    !Number.isSafeInteger(expectedAmount) ||
    expectedAmount <= 0 ||
    payment.amount !== expectedAmount ||
    payment.currency !== 'INR'
  ) {
    return result(400, {
      error:
        'The verified payment amount or currency does not match the order',
    });
  }

  if (payment.status === 'refunded') {
    return result(409, {
      error:
        'Razorpay reports that this payment is already refunded. The order needs reconciliation.',
    });
  }

  if (
    payment.status !== 'captured' ||
    payment.captured === false
  ) {
    return result(409, {
      error:
        'The payment has not been captured yet. Please retry verification after payment confirmation.',
    });
  }

  if (order.orderStatus === 'cancelled') {
    return initiateOrRetryRefund(orderId, payment.id);
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
          currentOrder.paymentReference === payment.id
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
      currentOrder.paymentReference = payment.id;
      currentOrder.inventoryAdjusted = true;
      currentOrder.orderStatus = 'confirmed';

      await currentOrder.save({
        session: dbSession,
      });
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '';

    if (
      message === 'INSUFFICIENT_STOCK' ||
      message === 'ORDER_CANCELLED'
    ) {
      failureReason = message;
    } else if (message === 'ORDER_ALREADY_PAID') {
      return result(409, {
        error:
          'This order has already been paid with another payment. Please contact support.',
      });
    } else if (message === 'ORDER_NOT_FOUND') {
      return result(404, {
        error: 'Order not found',
      });
    } else {
      throw error;
    }
  } finally {
    await dbSession.endSession();
  }

  if (alreadyVerified) {
    await dispatchOrderEmails(orderId);

    return result(200, {
      verified: true,
      alreadyVerified: true,
      paymentId: payment.id,
    });
  }

  if (failureReason) {
    return initiateOrRetryRefund(orderId, payment.id);
  }

  await dispatchOrderEmails(orderId);

  return result(200, {
    verified: true,
    paymentId: payment.id,
  });
}