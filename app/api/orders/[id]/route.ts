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

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await connectDB();

    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const sessionUser = session.user;
    const { id } = await params;

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
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Buyers can only view their own orders.
    if (sessionUser.role === 'buyer') {
      if (
        order.buyer._id.toString() !==
        sessionUser.id
      ) {
        return NextResponse.json(
          {
            error:
              'You are not authorized to view this order',
          },
          { status: 403 }
        );
      }
    }

    // Artists can only view orders containing
    // one of their artworks.
    if (sessionUser.role === 'artist') {
      const hasArtistArtwork =
        order.items.some((item) => {
          const artwork = item.artwork as any;

          return (
            artwork?.artist?._id?.toString() ===
            sessionUser.id
          );
        });

      if (!hasArtistArtwork) {
        return NextResponse.json(
          {
            error:
              'You are not authorized to view this order',
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error(
      '[GET /api/orders/[id]]',
      err
    );

    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id]
export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await connectDB();

    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const sessionUser = session.user;
    const { id } = await params;

    const body = await req.json();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }


    if (sessionUser.role === 'buyer') {
      if (
        order.buyer.toString() !==
        sessionUser.id
      ) {
        return NextResponse.json(
          {
            error:
              'You are not authorized to update this order',
          },
          { status: 403 }
        );
      }

      const requestedPaymentStatus =
        body.paymentStatus;

      const requestedOrderStatus =
        body.orderStatus;

      const isAllowedBuyerUpdate =
        requestedPaymentStatus === 'pending' &&
        requestedOrderStatus === 'placed';

      if (!isAllowedBuyerUpdate) {
        return NextResponse.json(
          {
            error:
              'Buyers cannot change the payment or order status',
          },
          { status: 403 }
        );
      }

      order.paymentStatus = 'pending';
      order.orderStatus = 'placed';

      await order.save();

      return NextResponse.json(order);
    }

    /*
     * ARTIST
     *
     * Artists can update operational fields for orders
     * containing one of their artworks.
     */
    if (sessionUser.role === 'artist') {
      const populatedOrder =
        await Order.findById(id).populate({
          path: 'items.artwork',
          select: 'artist',
        });

      if (!populatedOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      const ownsArtwork =
        populatedOrder.items.some(
          (item: any) =>
            item.artwork?.artist?.toString() ===
            sessionUser.id
        );

      if (!ownsArtwork) {
        return NextResponse.json(
          {
            error:
              'You are not authorized to update this order',
          },
          { status: 403 }
        );
      }

      const requestedOrderStatus =
        body.orderStatus;


      if (
        requestedOrderStatus === 'cancelled'
      ) {

        if (
          order.paymentStatus === 'paid'
        ) {
          return NextResponse.json(
            {
              error:
                'Paid orders require a refund before they can be cancelled',
            },
            { status: 400 }
          );
        }

        const dbSession =
          await mongoose.startSession();

        try {
          await dbSession.withTransaction(
            async () => {
              const currentOrder =
                await Order.findById(id).session(
                  dbSession
                );

              if (!currentOrder) {
                throw new Error(
                  'Order not found'
                );
              }

              if (
                currentOrder.orderStatus ===
                'cancelled'
              ) {
                return;
              }


              if (
                currentOrder.inventoryAdjusted
              ) {
                for (
                  const item of currentOrder.items
                ) {
                  if (
                    item.type !== 'original'
                  ) {
                    continue;
                  }

                  await Artwork.findByIdAndUpdate(
                    item.artwork,
                    {
                      $inc: {
                        stock: item.quantity,
                      },
                    },
                    {
                      session: dbSession,
                    }
                  );
                }

                currentOrder.inventoryAdjusted =
                  false;
              }

              currentOrder.orderStatus =
                'cancelled';

              await currentOrder.save({
                session: dbSession,
              });
            }
          );
        } finally {
          await dbSession.endSession();
        }

        const cancelledOrder =
          await Order.findById(id);

        return NextResponse.json(
          cancelledOrder
        );
      }


      const allowedArtistFields = [
        'orderStatus',
        'trackingNumber',
        'notes',
      ];

      const update: Record<
        string,
        unknown
      > = {};

      for (
        const key of allowedArtistFields
      ) {
        if (body[key] !== undefined) {
          update[key] = body[key];
        }
      }


      if (
        order.orderStatus === 'cancelled' &&
        requestedOrderStatus &&
        requestedOrderStatus !== 'cancelled'
      ) {
        return NextResponse.json(
          {
            error:
              'Cancelled orders cannot be reactivated from this endpoint',
          },
          { status: 400 }
        );
      }

      const updatedOrder =
        await Order.findByIdAndUpdate(
          id,
          update,
          {
            new: true,
            runValidators: true,
          }
        );

      return NextResponse.json(
        updatedOrder
      );
    }

    return NextResponse.json(
      {
        error:
          'You are not authorized to update orders',
      },
      { status: 403 }
    );
  } catch (err: unknown) {
    console.error(
      '[PATCH /api/orders/[id]]',
      err
    );

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