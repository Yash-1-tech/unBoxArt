import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Artwork from '@/models/Artwork';
import User from '@/models/User';
import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

type AllowedRole = 'buyer' | 'artist';

class RouteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'RouteError';
    this.status = status;
  }
}

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

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function getReferenceId(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (
    typeof value === 'object' &&
    '_id' in value &&
    value._id !== undefined
  ) {
    return String(value._id);
  }

  return String(value);
}

async function getCurrentUser(
  userId: string,
  sessionRole: string
) {
  const user = await User.findById(userId)
    .select('_id role')
    .lean();

  if (!user) {
    return {
      error: jsonError('User account not found', 401),
    };
  }

  if (
    (user.role !== 'buyer' && user.role !== 'artist') ||
    user.role !== sessionRole
  ) {
    return {
      error: jsonError(
        'Your account is not authorized for this action',
        403
      ),
    };
  }

  return { user };
}

/**
 * Artists receive only the items they own and a limited order response.
 * Buyer email, payment references, order totals, and other artists'
 * artwork are not included.
 */
function artistOrderResponse(
  order: any,
  items: any[]
) {
  const safeItems = items.map((item: any) => {
    const artwork = item.artwork;

    const safeArtwork =
      artwork &&
      typeof artwork === 'object' &&
      typeof artwork.title === 'string'
        ? {
            _id: String(artwork._id),
            title: artwork.title,
            images: artwork.images,
            code: artwork.code,
            medium: artwork.medium,
            ...(artwork.artist?.name
              ? {
                  artist: {
                    name: artwork.artist.name,
                  },
                }
              : {}),
          }
        : artwork
          ? String(artwork)
          : null;

    return {
      ...(item._id ? { _id: String(item._id) } : {}),
      artwork: safeArtwork,
      type: item.type,
      ...(item.printMedium
        ? { printMedium: item.printMedium }
        : {}),
      ...(item.printSize
        ? { printSize: item.printSize }
        : {}),
      quantity: item.quantity,
      price: item.price,
    };
  });

  const response: Record<string, unknown> = {
    _id: String(order._id),
    orderNumber: order.orderNumber,
    items: safeItems,
    shippingAddress: order.shippingAddress,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  // Include only the buyer's name when it has been populated.
  if (
    order.buyer &&
    typeof order.buyer === 'object' &&
    typeof order.buyer.name === 'string'
  ) {
    response.buyer = {
      name: order.buyer.name,
    };
  }

  return response;
}

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError('Invalid order ID', 400);
    }

    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    const sessionUser = session.user;

    if (
      sessionUser.role !== 'buyer' &&
      sessionUser.role !== 'artist'
    ) {
      return jsonError(
        'Not authorized to view orders',
        403
      );
    }

    if (
      typeof sessionUser.id !== 'string' ||
      !isValidObjectId(sessionUser.id)
    ) {
      return jsonError('Invalid user session', 401);
    }

    await connectDB();

    const currentUser = await getCurrentUser(
      sessionUser.id,
      sessionUser.role
    );

    if (currentUser.error) {
      return currentUser.error;
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
      const buyerId = getReferenceId(order.buyer);

      if (
        buyerId.toLowerCase() !==
        sessionUser.id.toLowerCase()
      ) {
        return jsonError(
          'You are not authorized to view this order',
          403
        );
      }

      return NextResponse.json(order);
    }

    const artistItems = order.items.filter((item: any) => {
      const artwork = item.artwork as any;

      const artworkArtistId = getReferenceId(
        artwork?.artist
      );

      return (
        artworkArtistId.toLowerCase() ===
        sessionUser.id.toLowerCase()
      );
    });

    if (artistItems.length === 0) {
      return jsonError(
        'You are not authorized to view this order',
        403
      );
    }

    return NextResponse.json(
      artistOrderResponse(order, artistItems)
    );
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
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError('Invalid order ID', 400);
    }

    const session = await getSession();

    if (!session.user) {
      return jsonError('Authentication required', 401);
    }

    const sessionUser = session.user;

    if (
      sessionUser.role !== 'buyer' &&
      sessionUser.role !== 'artist'
    ) {
      return jsonError(
        'Not authorized to update orders',
        403
      );
    }

    if (
      typeof sessionUser.id !== 'string' ||
      !isValidObjectId(sessionUser.id)
    ) {
      return jsonError('Invalid user session', 401);
    }

    await connectDB();

    const currentUser = await getCurrentUser(
      sessionUser.id,
      sessionUser.role
    );

    if (currentUser.error) {
      return currentUser.error;
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON request body', 400);
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return jsonError('Invalid request body', 400);
    }

    const updateBody = body as Record<string, unknown>;
    const bodyKeys = Object.keys(updateBody);

    if (bodyKeys.length === 0) {
      return jsonError(
        'At least one update field is required',
        400
      );
    }

    const forbiddenFields = [
      'buyer',
      'items',
      'total',
      'subtotal',
      'shippingCost',
      'discount',
      'paymentMethod',
      'paymentStatus',
      'paymentReference',
      'razorpayOrderId',
      'refundStatus',
      'refundReference',
      'refundIdempotencyKey',
      'refundError',
      'inventoryAdjusted',
      'inventoryReservationExpiresAt',
      'inventoryReleasedAt',
      'orderNumber',
      'createdAt',
      'updatedAt',
    ];

    const forbiddenField = forbiddenFields.find(
      (field) => updateBody[field] !== undefined
    );

    if (forbiddenField) {
      return jsonError(
        'Payment, ownership, inventory and financial fields cannot be changed here',
        400
      );
    }

    const allowedFields = new Set([
      'orderStatus',
      'trackingNumber',
      'notes',
    ]);

    const unsupportedField = bodyKeys.find(
      (field) => !allowedFields.has(field)
    );

    if (unsupportedField) {
      return jsonError(
        `Unsupported update field: ${unsupportedField}`,
        400
      );
    }

    if (
      updateBody.orderStatus !== undefined &&
      typeof updateBody.orderStatus !== 'string'
    ) {
      return jsonError('Invalid order status', 400);
    }

    if (
      updateBody.trackingNumber !== undefined &&
      typeof updateBody.trackingNumber !== 'string'
    ) {
      return jsonError('Tracking number must be a string', 400);
    }

    if (
      updateBody.notes !== undefined &&
      typeof updateBody.notes !== 'string'
    ) {
      return jsonError('Notes must be a string', 400);
    }

    if (
      typeof updateBody.trackingNumber === 'string' &&
      updateBody.trackingNumber.length > 120
    ) {
      return jsonError(
        'Tracking number cannot exceed 120 characters',
        400
      );
    }

    if (
      typeof updateBody.notes === 'string' &&
      updateBody.notes.length > 2000
    ) {
      return jsonError(
        'Notes cannot exceed 2000 characters',
        400
      );
    }

    const requestedStatus =
      updateBody.orderStatus as string | undefined;

    const order = await Order.findById(id);

    if (!order) {
      return jsonError('Order not found', 404);
    }

    const isBuyer = sessionUser.role === 'buyer';
    const isArtist = sessionUser.role === 'artist';

    if (isBuyer) {
      if (
        order.buyer.toString().toLowerCase() !==
        sessionUser.id.toLowerCase()
      ) {
        return jsonError(
          'You are not authorized to update this order',
          403
        );
      }

      if (
        requestedStatus !== 'cancelled' ||
        bodyKeys.some((field) => field !== 'orderStatus')
      ) {
        return jsonError(
          'Buyers can only cancel their own eligible orders',
          400
        );
      }
    }

    if (isArtist) {
      const artworkIds = [
        ...new Set(
          order.items.map((item) =>
            item.artwork.toString()
          )
        ),
      ];

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

    if (requestedStatus === 'cancelled') {
      if (
        bodyKeys.some((field) => field !== 'orderStatus')
      ) {
        return jsonError(
          'Only orderStatus may be supplied when cancelling',
          400
        );
      }

      if (order.paymentStatus === 'paid') {
        return jsonError(
          'Paid orders require a refund workflow before cancellation',
          400
        );
      }

      if (order.paymentStatus === 'refunded') {
        return jsonError(
          'Refunded orders cannot be cancelled again',
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
          const currentOrder = await Order.findById(id)
            .session(dbSession);

          if (!currentOrder) {
            throw new RouteError('Order not found', 404);
          }

          if (currentOrder.orderStatus === 'cancelled') {
            return;
          }

          if (
            isBuyer &&
            currentOrder.buyer.toString().toLowerCase() !==
              sessionUser.id.toLowerCase()
          ) {
            throw new RouteError(
              'You are not authorized to update this order',
              403
            );
          }

          if (isArtist) {
            const currentArtworkIds = [
              ...new Set(
                currentOrder.items.map((item) =>
                  item.artwork.toString()
                )
              ),
            ];

            const currentOwnedArtworks = await Artwork.find({
              _id: { $in: currentArtworkIds },
              artist: sessionUser.id,
            })
              .select('_id')
              .session(dbSession)
              .lean();

            const currentOwnedIds = new Set(
              currentOwnedArtworks.map((artwork) =>
                artwork._id.toString()
              )
            );

            if (currentOwnedIds.size === 0) {
              throw new RouteError(
                'You are not authorized to update this order',
                403
              );
            }

            if (
              !currentArtworkIds.every((artworkId) =>
                currentOwnedIds.has(artworkId)
              )
            ) {
              throw new RouteError(
                'This order contains artwork from multiple artists. Order-level changes are disabled for mixed-artist orders.',
                400
              );
            }
          }

          if (
            currentOrder.paymentStatus === 'paid' ||
            currentOrder.paymentStatus === 'refunded'
          ) {
            throw new RouteError(
              'This order cannot be cancelled in its current payment state',
              400
            );
          }

          if (
            currentOrder.orderStatus !== 'placed' &&
            currentOrder.orderStatus !== 'confirmed'
          ) {
            throw new RouteError(
              'This order can no longer be cancelled',
              400
            );
          }

          if (currentOrder.inventoryAdjusted) {
            for (const item of currentOrder.items) {
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
        if (err instanceof RouteError) {
          return jsonError(err.message, err.status);
        }

        throw err;
      } finally {
        await dbSession.endSession();
      }

      const cancelledOrder = await Order.findById(id);

      if (!cancelledOrder) {
        return jsonError('Order not found', 404);
      }

      if (isArtist) {
        return NextResponse.json(
          artistOrderResponse(
            cancelledOrder,
            cancelledOrder.items
          )
        );
      }
      return NextResponse.json(cancelledOrder);
    }

    if (!isArtist) {
      return jsonError(
        'Buyers can only cancel their own eligible orders',
        400
      );
    }

    if (
      requestedStatus !== undefined &&
      (
        order.paymentStatus === 'failed' ||
        order.paymentStatus === 'refunded' ||
        order.refundStatus === 'pending' ||
        order.refundStatus === 'processed'
      )
    ) {
      return jsonError(
        'This order cannot advance while payment has failed or a refund is pending or completed',
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
    }

    if (
      updateBody.trackingNumber !== undefined &&
      requestedStatus !== 'shipped'
    ) {
      return jsonError(
        'Tracking information can only be set when marking the order as shipped',
        400
      );
    }

    if (requestedStatus === 'shipped') {
      if (
        typeof updateBody.trackingNumber !== 'string' ||
        !updateBody.trackingNumber.trim()
      ) {
        return jsonError(
          'A tracking number is required before marking an order as shipped',
          400
        );
      }

      order.trackingNumber =
        updateBody.trackingNumber.trim();
    }

    if (requestedStatus !== undefined) {
      order.orderStatus = requestedStatus as
        | 'placed'
        | 'confirmed'
        | 'shipped'
        | 'delivered';
    }

    if (updateBody.notes !== undefined) {
      order.notes =
        (updateBody.notes as string).trim();
    }

    await order.save();

    return NextResponse.json(
      artistOrderResponse(order, order.items)
    );
  } catch (err) {
    console.error('[PATCH /api/orders/[id]]', err);

    return jsonError('Failed to update order', 500);
  }
}
