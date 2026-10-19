import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import mongoose from 'mongoose';

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

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    const sessionUser = session.user;
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError('Invalid order ID', 400);
    }

    if (
      sessionUser.role !== 'buyer' &&
      sessionUser.role !== 'artist'
    ) {
      return jsonError('Not authorized to view orders', 403);
    }

    const order = await Order.findById(id)
      .populate({
        path: 'items.artwork',
        select: 'title images code medium artist',
        populate: {
          path: 'artist',
          select: 'name',
        },
      })
      .populate('buyer', 'name email');

    if (!order) {
      return jsonError('Order not found', 404);
    }

    if (sessionUser.role === 'buyer') {
      const buyerId = (order.buyer as any)?._id
        ? String((order.buyer as any)._id)
        : String(order.buyer);

      if (buyerId !== sessionUser.id) {
        return jsonError(
          'You are not authorized to view this order',
          403
        );
      }
    }

    if (sessionUser.role === 'artist') {
      const hasArtistArtwork = order.items.some((item) => {
        const artwork = item.artwork as any;

        const artistId = artwork?.artist?._id
          ? String(artwork.artist._id)
          : artwork?.artist
            ? String(artwork.artist)
            : '';

        return artistId === sessionUser.id;
      });

      if (!hasArtistArtwork) {
        return jsonError(
          'You are not authorized to view this order',
          403
        );
      }
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err);

    return jsonError('Failed to fetch order', 500);
  }
}

// PATCH /api/orders/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    const sessionUser = session.user;
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError('Invalid order ID', 400);
    }

    if (
      sessionUser.role !== 'buyer' &&
      sessionUser.role !== 'artist'
    ) {
      return jsonError('Not authorized to update orders', 403);
    }

    const body = await req.json();

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Invalid request body', 400);
    }

    const forbiddenFields = [
      'paymentStatus',
      'paymentReference',
      'inventoryAdjusted',
      'buyer',
      'items',
      'total',
      'subtotal',
      'shippingCost',
      'discount',
      'paymentMethod',
    ];

    if (
      forbiddenFields.some(
        (field) => body[field] !== undefined
      )
    ) {
      return jsonError(
        'Payment, buyer, order totals and inventory fields cannot be changed here',
        400
      );
    }

    const allowedFields = [
      'orderStatus',
      'trackingNumber',
      'notes',
    ];

    const unknownFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return jsonError(
        `Unsupported update field: ${unknownFields[0]}`,
        400
      );
    }

    if (
      body.orderStatus !== undefined &&
      typeof body.orderStatus !== 'string'
    ) {
      return jsonError('Invalid order status', 400);
    }

    const requestedStatus = body.orderStatus as
      | string
      | undefined;

    const order = await Order.findById(id);

    if (!order) {
      return jsonError('Order not found', 404);
    }

    /*
     * BUYER PERMISSIONS
     * Buyers may only cancel their own eligible orders.
     */
    if (sessionUser.role === 'buyer') {
      const buyerId = String(order.buyer);

      if (buyerId !== sessionUser.id) {
        return jsonError(
          'You are not authorized to update this order',
          403
        );
      }

      if (
        requestedStatus !== 'cancelled' ||
        Object.keys(body).some(
          (field) => field !== 'orderStatus'
        )
      ) {
        return jsonError(
          'Buyers can only request cancellation of their own eligible orders',
          400
        );
      }
    }

    /*
     * ARTIST PERMISSIONS
     * Preserve the existing ownership checks and
     * mixed-artist order restrictions.
     */
    if (sessionUser.role === 'artist') {
      const artworkIds = order.items.map((item) =>
        item.artwork.toString()
      );

      const ownedArtworks = await Artwork.find({
        _id: { $in: artworkIds },
        artist: sessionUser.id,
      })
        .select('_id')
        .lean();

      const ownedArtworkIds = new Set(
        ownedArtworks.map((artwork) =>
          artwork._id.toString()
        )
      );

      const ownsAnyItem = artworkIds.some((artworkId) =>
        ownedArtworkIds.has(artworkId)
      );

      if (!ownsAnyItem) {
        return jsonError(
          'You are not authorized to update this order',
          403
        );
      }

      const ownsEveryItem = artworkIds.every(
        (artworkId) => ownedArtworkIds.has(artworkId)
      );

      if (!ownsEveryItem) {
        return jsonError(
          'This order contains artwork from multiple artists. Order-level changes are disabled for mixed-artist orders.',
          400
        );
      }
    }

    /*
     * CANCELLATION
     * Shared by authorized buyers and artists.
     */
    if (requestedStatus === 'cancelled') {
      if (order.paymentStatus === 'paid') {
        return jsonError(
          'Paid orders require a refund workflow before cancellation',
          400
        );
      }

      if (
        order.orderStatus !== 'placed' &&
        order.orderStatus !== 'confirmed'
      ) {
        return jsonError(
          'Only placed or confirmed orders can be cancelled',
          400
        );
      }

      const dbSession = await mongoose.startSession();

      try {
        await dbSession.withTransaction(async () => {
          const currentOrder = await Order.findById(id).session(
            dbSession
          );

          if (!currentOrder) {
            throw new Error('Order not found');
          }

          // Prevent duplicate stock restoration.
          if (currentOrder.orderStatus === 'cancelled') {
            return;
          }

          if (currentOrder.paymentStatus === 'paid') {
            throw new Error(
              'Paid orders cannot be cancelled without a refund'
            );
          }

          if (
            currentOrder.orderStatus !== 'placed' &&
            currentOrder.orderStatus !== 'confirmed'
          ) {
            throw new Error(
              'This order can no longer be cancelled'
            );
          }

          // Restore stock only if this order previously
          // deducted inventory.
          if (currentOrder.inventoryAdjusted) {
            for (const item of currentOrder.items) {
              // Digital prints do not consume original stock.
              if (item.type !== 'original') {
                continue;
              }

              const restoredArtwork =
                await Artwork.findByIdAndUpdate(
                  item.artwork,
                  {
                    $inc: {
                      stock: item.quantity,
                    },
                  },
                  {
                    new: true,
                    session: dbSession,
                  }
                );

              if (!restoredArtwork) {
                throw new Error(
                  'Could not restore stock for an artwork in this order'
                );
              }
            }

            currentOrder.inventoryAdjusted = false;
          }

          currentOrder.orderStatus = 'cancelled';

          await currentOrder.save({
            session: dbSession,
          });
        });
      } catch (err) {
        if (err instanceof Error) {
          const status =
            err.message === 'Order not found' ? 404 : 400;

          if (
            err.message === 'Order not found' ||
            err.message ===
              'Paid orders cannot be cancelled without a refund' ||
            err.message ===
              'This order can no longer be cancelled'
          ) {
            return jsonError(err.message, status);
          }
        }

        throw err;
      } finally {
        await dbSession.endSession();
      }

      const cancelledOrder = await Order.findById(id);

      return NextResponse.json(cancelledOrder);
    }

    /*
     * All remaining updates are artist-only.
     */
    if (sessionUser.role !== 'artist') {
      return jsonError(
        'Buyers can only cancel their own eligible orders',
        400
      );
    }

    if (requestedStatus !== undefined) {
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

      if (requestedStatus === 'shipped') {
        if (
          typeof body.trackingNumber !== 'string' ||
          !body.trackingNumber.trim()
        ) {
          return jsonError(
            'A tracking number is required before marking an order as shipped',
            400
          );
        }

        order.trackingNumber = body.trackingNumber.trim();
      }
    } else if (body.trackingNumber !== undefined) {
      return jsonError(
        'Tracking information can only be set when marking the order as shipped',
        400
      );
    }

    if (requestedStatus !== undefined) {
      order.orderStatus = requestedStatus as
        | 'placed'
        | 'confirmed'
        | 'shipped'
        | 'delivered';
    }

    if (body.notes !== undefined) {
      if (typeof body.notes !== 'string') {
        return jsonError('Notes must be a string', 400);
      }

      order.notes = body.notes;
    }

    await order.save();

    return NextResponse.json(order);
  } catch (err: unknown) {
    console.error('[PATCH /api/orders/[id]]', err);

    const message =
      err instanceof Error
        ? err.message
        : 'Failed to update order';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}