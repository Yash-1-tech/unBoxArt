import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Artwork from '@/models/Artwork';

// GET /api/orders/seller?artistId=xxx
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const artistId = searchParams.get('artistId');

    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required' }, { status: 400 });
    }

    // Find all artworks by this artist
    const artworks = await Artwork.find({ artist: artistId }).select('_id title').lean();
    const artworkIds = artworks.map((a) => a._id);

    // Find all orders containing those artworks
    const orders = await Order.find({
      'items.artwork': { $in: artworkIds },
    })
      .populate({
        path: 'items.artwork',
        select: 'title images code medium originalPrice',
      })
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Filter items to only show THIS artist's artworks
    const filteredOrders = orders.map((order) => ({
      ...order,
      items: order.items.filter((item: any) =>
        artworkIds.some((id) => id.toString() === item.artwork?._id?.toString())
      ),
    }));

    return NextResponse.json({ orders: filteredOrders });
  } catch (err) {
    console.error('[GET /api/orders/seller]', err);
    return NextResponse.json({ error: 'Failed to fetch seller orders' }, { status: 500 });
  }
}
