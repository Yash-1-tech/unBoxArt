import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import Order from '@/models/Order';

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

export async function PATCH(
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
    const allowedFields = ['orderStatus', 'trackingNumber'];

    if (
      Object.keys(data).length === 0 ||
      Object.keys(data).some(
        (field) => !allowedFields.includes(field)
      )
    ) {
      return jsonError(
        'Only orderStatus and trackingNumber can be updated',
        400
      );
    }

    if (
      typeof data.orderStatus !== 'string' ||
      !['confirmed', 'shipped', 'delivered'].includes(
        data.orderStatus
      )
    ) {
      return jsonError('Invalid order status', 400);
    }

    if (
      data.trackingNumber !== undefined &&
      typeof data.trackingNumber !== 'string'
    ) {
      return jsonError(
        'Tracking number must be a string',
        400
      );
    }

    const requestedStatus = data.orderStatus;

    const trackingNumber =
      typeof data.trackingNumber === 'string'
        ? data.trackingNumber.trim()
        : '';

    if (
      typeof data.trackingNumber === 'string' &&
      data.trackingNumber.length > 120
    ) {
      return jsonError(
        'Tracking number cannot exceed 120 characters',
        400
      );
    }

    if (
      data.trackingNumber !== undefined &&
      requestedStatus !== 'shipped'
    ) {
      return jsonError(
        'Tracking information can only be supplied when marking an order as shipped',
        400
      );
    }

    if (
      requestedStatus === 'shipped' &&
      !trackingNumber
    ) {
      return jsonError(
        'A tracking number is required before marking an order as shipped',
        400
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return jsonError('Order not found', 404);
    }

    const validTransition =
      (order.orderStatus === 'placed' &&
        requestedStatus === 'confirmed') ||
      (order.orderStatus === 'confirmed' &&
        requestedStatus === 'shipped') ||
      (order.orderStatus === 'shipped' &&
        requestedStatus === 'delivered');

    if (!validTransition) {
      return jsonError(
        `Invalid status transition from "${order.orderStatus}" to "${requestedStatus}"`,
        400
      );
    }

    const unpaidNonCodOrder =
      order.paymentMethod !== 'cod' &&
      order.paymentStatus !== 'paid';

    const failedOrRefundedOrder =
      order.paymentStatus === 'failed' ||
      order.paymentStatus === 'refunded' ||
      order.refundStatus === 'pending' ||
      order.refundStatus === 'processed';

    if (unpaidNonCodOrder || failedOrRefundedOrder) {
      return jsonError(
        'This order cannot advance until payment is confirmed and any refund issues are resolved',
        400
      );
    }

    // Include the current state in the update filter so a
    // concurrent status or payment change cannot be overwritten.
    const filter: Record<string, unknown> = {
      _id: id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
    };

    if (order.refundStatus === undefined) {
      filter.refundStatus = { $exists: false };
    } else {
      filter.refundStatus = order.refundStatus;
    }

    const updates: Record<string, unknown> = {
      orderStatus: requestedStatus,
    };

    if (requestedStatus === 'shipped') {
      updates.trackingNumber = trackingNumber;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      filter,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select('_id orderNumber orderStatus trackingNumber updatedAt');

    if (!updatedOrder) {
      return jsonError(
        'The order changed while you were updating it. Refresh and try again.',
        409
      );
    }

    return NextResponse.json(
      {
        message: 'Order updated successfully',
        order: updatedOrder,
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return jsonError('Invalid order data', 400);
    }

    console.error('[PATCH /api/admin/orders/:id]', error);

    return jsonError('Failed to update order', 500);
  }
}
