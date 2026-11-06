import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import Order from '@/models/Order';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'refunded',
];

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: noStoreHeaders,
    }
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '20');
    const orderStatus = searchParams.get('orderStatus') ?? 'all';
    const paymentStatus = searchParams.get('paymentStatus') ?? 'all';
    const search = (searchParams.get('search') ?? '').trim();

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 50 ||
      !Number.isSafeInteger((page - 1) * limit)
    ) {
      return jsonError('Invalid pagination parameters', 400);
    }

    if (
      orderStatus !== 'all' &&
      !ORDER_STATUSES.includes(orderStatus)
    ) {
      return jsonError('Invalid order status filter', 400);
    }

    if (
      paymentStatus !== 'all' &&
      !PAYMENT_STATUSES.includes(paymentStatus)
    ) {
      return jsonError('Invalid payment status filter', 400);
    }

    if (search.length > 100) {
      return jsonError(
        'Search must not exceed 100 characters',
        400
      );
    }

    const query: Record<string, unknown> = {};

    if (orderStatus !== 'all') {
      query.orderStatus = orderStatus;
    }

    if (paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.orderNumber = {
        $regex: escapeRegex(search),
        $options: 'i',
      };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select(
          '_id orderNumber buyer items subtotal shippingCost discount total paymentMethod paymentStatus refundStatus orderStatus trackingNumber shippingAddress.city shippingAddress.state shippingAddress.country createdAt updatedAt'
        )
        .populate('buyer', 'name email')
        .populate({
          path: 'items.artwork',
          select: 'title images code medium artist',
          populate: {
            path: 'artist',
            select: 'name',
          },
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[GET /api/admin/orders]', error);

    return jsonError('Failed to fetch orders', 500);
  }
}
