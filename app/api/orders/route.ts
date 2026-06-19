import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';

// GET /api/orders?buyerId=xxx
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');

    if (!buyerId) {
      return NextResponse.json({ error: 'buyerId is required' }, { status: 400 });
    }

    const orders = await Order.find({ buyer: buyerId })
      .populate({
        path: 'items.artwork',
        select: 'title images code medium',
        populate: { path: 'artist', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders — create order
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { buyer, items, shippingAddress, paymentMethod } = body;

    if (!buyer || !items?.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = subtotal >= 5000 ? 0 : 500;
    const total = subtotal + shippingCost;

    const order = await Order.create({
      buyer,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      discount: 0,
      total,
      paymentStatus: 'pending',
      orderStatus: 'placed',
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/orders]', err);
    const message = err instanceof Error ? err.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
