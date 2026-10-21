import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';

export const runtime = 'nodejs';

type RefundWebhookPayload = {
  event?: string;
  payload?: {
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        status?: string;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-razorpay-signature");

  if (!secret || !signature) {
    return NextResponse.json(
      { error: "Webhook configuration or signature missing" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const received = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: RefundWebhookPayload;

  try {
    body = JSON.parse(rawBody) as RefundWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event !== "refund.processed" && body.event !== "refund.failed") {
    return NextResponse.json({ received: true });
  }

  const refund = body.payload?.refund?.entity;
  const paymentId = refund?.payment_id;
  const refundId = refund?.id;

  if (!paymentId || !refundId) {
    return NextResponse.json(
      { error: "Refund or payment ID missing" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const order = await Order.findOne({ paymentReference: paymentId });

    if (!order) {
      console.error("Razorpay refund webhook: no matching order", {
        paymentId,
        refundId,
      });

      return NextResponse.json({ received: true });
    }

    if (
      order.refundReference &&
      order.refundReference !== refundId
    ) {
      console.error("Razorpay refund webhook: refund ID mismatch", {
        orderId: order._id.toString(),
        existingRefundId: order.refundReference,
        incomingRefundId: refundId,
      });

      return NextResponse.json({ received: true });
    }

    if (body.event === "refund.processed") {
      order.refundStatus = "processed";
      order.paymentStatus = "refunded";
      order.refundReference = refundId;
      order.refundError = undefined;
    } else {
      order.refundStatus = "failed";
      order.paymentStatus = "paid";
      order.refundReference = refundId;
      order.refundError = "Razorpay reported that the refund failed.";
    }

    await order.save();

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay refund webhook processing failed:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}