import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Artwork from '@/models/Artwork';

import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

async function getSession() {
  const cookieStore = await cookies();

  return getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
}

// GET /api/orders/seller
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Require an authenticated session.
    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const sessionUser = session.user;

    // Only artist accounts can access seller orders.
    if (sessionUser.role !== 'artist') {
      return NextResponse.json(
        { error: 'Only artists can view seller orders' },
        { status: 403 }
      );
    }

    // The session is the source of truth for artist identity.
    const { searchParams } = new URL(req.url);
    const requestedArtistId = searchParams.get('artistId');

    if (
      requestedArtistId &&
      requestedArtistId !== sessionUser.id
    ) {
      return NextResponse.json(
        {
          error: 'You are not authorized to view these sales',
        },
        { status: 403 }
      );
    }

    // Find artworks belonging to the authenticated artist.
    const artworks = await Artwork.find({
      artist: sessionUser.id,
    })
      .select('_id title')
      .lean();

    const artworkIds = artworks.map((artwork) =>
      artwork._id.toString()
    );

    if (artworkIds.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // Find orders containing this artist's artworks.
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

    const artistArtworkIds = new Set(artworkIds);

    // Keep only this artist's items and calculate their item subtotal.
    const filteredOrders = orders
      .map((order) => {
        const artistItems = order.items.filter((item: any) => {
          const artworkId = item.artwork?._id?.toString();

          return (
            artworkId &&
            artistArtworkIds.has(artworkId)
          );
        });

        const artistSubtotal = artistItems.reduce(
          (sum: number, item: any) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;

            return sum + price * quantity;
          },
          0
        );

        return {
          ...order,
          items: artistItems,
          artistSubtotal,
        };
      })
      .filter((order) => order.items.length > 0);

    return NextResponse.json({
      orders: filteredOrders,
    });
  } catch (err) {
    console.error('[GET /api/orders/seller]', err);

    return NextResponse.json(
      { error: 'Failed to fetch seller orders' },
      { status: 500 }
    );
  }
}