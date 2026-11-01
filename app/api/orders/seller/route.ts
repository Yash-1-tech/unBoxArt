
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { Types } from 'mongoose';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Artwork from '@/models/Artwork';
import User from '@/models/User';

import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

function jsonResponse(
  data: unknown,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders,
  });
}

function isValidId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

async function getSession() {
  return getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
}

type SellerOrderItem = {
  artwork: {
    _id: Types.ObjectId | string;
    title?: string;
    images?: string[];
    code?: string;
  } | null;
  type: string;
  quantity: number;
  price: number;
  printMedium?: string;
  printSize?: string;
};

type SellerAddress = {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

type SellerBuyer = {
  name?: string;
  email?: string;
};

// GET /api/orders/seller
export async function GET(req: NextRequest) {
  try {
    // Require an authenticated session.
    const session = await getSession();
    const sessionUserId = session.user?.id;

    if (!sessionUserId || !isValidId(sessionUserId)) {
      return jsonResponse(
        { error: 'Authentication required' },
        401
      );
    }

    // Only artist accounts can access seller orders.
    if (session.user?.role !== 'artist') {
      return jsonResponse(
        { error: 'Only artists can view seller orders' },
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedArtistId = searchParams.get('artistId');

    if (
      requestedArtistId &&
      !isValidId(requestedArtistId)
    ) {
      return jsonResponse(
        { error: 'Invalid artist ID' },
        400
      );
    }

    // Never trust the artist ID supplied by the browser.
    if (
      requestedArtistId &&
      requestedArtistId.toLowerCase() !==
        sessionUserId.toLowerCase()
    ) {
      return jsonResponse(
        { error: 'You are not authorized to view these sales' },
        403
      );
    }

    await connectDB();

    // Verify that the account still exists and is currently an artist.
    const artist = await User.findById(sessionUserId)
      .select('_id role')
      .lean();

    if (!artist) {
      session.destroy();

      return jsonResponse(
        { error: 'User account no longer exists. Please sign in again.' },
        401
      );
    }

    if (artist.role !== 'artist') {
      session.destroy();

      return jsonResponse(
        { error: 'Artist account access is no longer available' },
        403
      );
    }

    // Find only artworks owned by the authenticated artist.
    const artworks = await Artwork.find({
      artist: artist._id,
    })
      .select('_id')
      .lean();

    const artworkIds = artworks.map(
      (artwork) => artwork._id
    );

    if (artworkIds.length === 0) {
      return jsonResponse({ orders: [] });
    }

    // Fetch only the order fields required by the seller dashboard.
    const orders = await Order.find({
      'items.artwork': { $in: artworkIds },
    })
      .select(
        '_id orderNumber items buyer shippingAddress paymentStatus orderStatus trackingNumber createdAt'
      )
      .populate({
        path: 'items.artwork',
        select: '_id title images code',
      })
      .populate({
        path: 'buyer',
        select: 'name email',
      })
      .sort({ createdAt: -1 })
      .lean();

    const artistArtworkIds = new Set(
      artworkIds.map((id) => id.toString())
    );

    // Return only this artist's items from each matching order.
    const filteredOrders = orders
      .map((order) => {
        const rawItems =
          order.items as unknown as SellerOrderItem[];

        const artistItems = rawItems.filter((item) => {
          const artworkId = item.artwork?._id?.toString();

          return (
            artworkId &&
            artistArtworkIds.has(artworkId)
          );
        });

        if (artistItems.length === 0) {
          return null;
        }

        const safeItems = artistItems.map((item) => {
          const price = Number(item.price);
          const quantity = Number(item.quantity);

          return {
            artwork: item.artwork
              ? {
                  _id: item.artwork._id.toString(),
                  title: item.artwork.title || 'Artwork',
                  images: Array.isArray(item.artwork.images)
                    ? item.artwork.images
                    : [],
                  code: item.artwork.code || '',
                }
              : null,
            type: item.type,
            quantity:
              Number.isSafeInteger(quantity) && quantity > 0
                ? quantity
                : 0,
            price:
              Number.isFinite(price) && price >= 0
                ? price
                : 0,
            ...(item.printMedium
              ? { printMedium: item.printMedium }
              : {}),
            ...(item.printSize
              ? { printSize: item.printSize }
              : {}),
          };
        });

        const artistSubtotal = safeItems.reduce(
          (sum, item) =>
            sum + item.price * item.quantity,
          0
        );

        const buyer =
          order.buyer as unknown as SellerBuyer | null;

        const shippingAddress =
          order.shippingAddress as SellerAddress | undefined;

        // Explicitly construct the response.
        // Do not spread the original order document.
        return {
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          buyer: {
            name: buyer?.name || 'Buyer',
            email: buyer?.email || '',
          },
          items: safeItems,
          shippingAddress: shippingAddress
            ? {
                fullName: shippingAddress.fullName || '',
                phone: shippingAddress.phone || '',
                addressLine1:
                  shippingAddress.addressLine1 || '',
                city: shippingAddress.city || '',
                state: shippingAddress.state || '',
                pincode: shippingAddress.pincode || '',
                country: shippingAddress.country || '',
              }
            : null,
          artistSubtotal,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          ...(order.trackingNumber
            ? { trackingNumber: order.trackingNumber }
            : {}),
          createdAt: order.createdAt,
        };
      })
      .filter((order) => order !== null);

    return jsonResponse({
      orders: filteredOrders,
    });
  } catch (err) {
    console.error('[GET /api/orders/seller]', err);

    return jsonResponse(
      { error: 'Failed to fetch seller orders' },
      500
    );
  }
}
