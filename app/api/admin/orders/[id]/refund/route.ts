import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAdminUser } from '@/lib/adminAuth';
import Order from '@/models/Order';
import { initiateOrRetryRefund } from '@/lib/razorpay-payment';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: noStoreHeaders,
    }
  );
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return jsonError('Invalid order ID', 400);
    }

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

    const data = body as Record<string, unknown>;

    if (
      Object.keys(data).length !== 1 ||
      data.confirmFullRefund !== true
    ) {
      return jsonError(
        'Explicit confirmation of a full refund is required',
        400
      );
    }

    await connectDB();

    const order = await Order.findById(id)
      .select(
        '_id orderNumber paymentMethod paymentStatus paymentReference refundStatus orderStatus total'
      )
      .lean();

    if (!order) {
      return jsonError('Order not found', 404);
    }

    if (order.paymentMethod !== 'razorpay') {
      return jsonError(
        'Only Razorpay orders can be refunded through this action',
        400
      );
    }

    if (
      order.paymentStatus !== 'paid' ||
      typeof order.paymentReference !== 'string' ||
      !order.paymentReference.trim()
    ) {
      return jsonError(
        'Only successfully paid orders with a verified payment reference can be refunded',
        400
      );
    }

    if (
      !Number.isFinite(order.total) ||
      order.total <= 0
    ) {
      return jsonError(
        'The order amount is invalid and requires manual review',
        400
      );
    }

    if (order.refundStatus === 'processed') {
      return jsonError(
        'This order has already been fully refunded',
        409
      );
    }

    if (order.refundStatus === 'pending') {
      return jsonError(
        'A refund is already pending for this order. Check the Razorpay refund status before retrying.',
        409
      );
    }

    if (
      order.orderStatus === 'shipped' ||
      order.orderStatus === 'delivered' ||
      order.orderStatus === 'returned'
    ) {
      return jsonError(
        'This order has progressed beyond the eligible cancellation stage. Handle it through a separate return and refund process.',
        400
      );
    }

    const retryingFailedRefund =
      order.refundStatus === 'failed';

    if (
      retryingFailedRefund &&
      order.orderStatus !== 'cancelled'
    ) {
      return jsonError(
        'The failed refund state requires manual reconciliation',
        409
      );
    }

    if (
      !retryingFailedRefund &&
      order.orderStatus !== 'placed' &&
      order.orderStatus !== 'confirmed'
    ) {
      return jsonError(
        'Only placed or confirmed orders can be refunded through this action',
        400
      );
    }

    // Reuses the existing idempotent full-refund workflow.
    // Razorpay webhook processing remains responsible for
    // confirming the final refund and restoring inventory.
    const result = await initiateOrRetryRefund(
      id,
      order.paymentReference
    );

    return NextResponse.json(
      {
        orderNumber: order.orderNumber,
        ...result.body,
      },
      {
        status: result.status,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[POST /api/admin/orders/:id/refund]', error);

    return jsonError(
      'Could not initiate the refund. Check the order and Razorpay status before retrying.',
      500
    );
  }
}
