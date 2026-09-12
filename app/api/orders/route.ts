import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Artwork from '@/models/Artwork';
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from '@/lib/email';

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
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { buyer, items, shippingAddress, paymentMethod } = body;

    if (!buyer || !items?.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const shippingCost = subtotal >= 5000 ? 0 : 500;
    const total = subtotal + shippingCost;

    const order = await Order.create({
      buyer, items, shippingAddress, paymentMethod,
      subtotal, shippingCost, discount: 0, total,
      paymentStatus: 'pending', orderStatus: 'placed',
    });

    // Send emails (fire and forget)
    try {
      const [buyerUser, ...artworkDocs] = await Promise.all([
        User.findById(buyer).select('name email').lean(),
        ...items.map((item: { artwork: string }) =>
          Artwork.findById(item.artwork)
            .populate('artist', 'name email')
            .select('title artist')
            .lean()
        ),
      ]);

      if (buyerUser) {
        // Buyer confirmation
        sendOrderConfirmationEmail(
          (buyerUser as any).email,
          (buyerUser as any).name,
          order.orderNumber,
          artworkDocs.map((art: any, i: number) => ({
            title: art?.title || 'Artwork',
            price: items[i].price,
            type: items[i].type,
          })),
          total
        ).catch(() => {});

        // Notify each artist
        const notified = new Set<string>();
        artworkDocs.forEach((art: any) => {
          if (art?.artist && !notified.has(art.artist._id.toString())) {
            notified.add(art.artist._id.toString());
            sendNewOrderNotificationEmail(
              art.artist.email,
              art.artist.name,
              order.orderNumber,
              art.title,
              (buyerUser as any).name,
              total
            ).catch(() => {});
          }
        });
      }
    } catch {
      // Email errors never break the order flow
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
