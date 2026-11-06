import { NextResponse } from 'next/server';

import { getAdminUser } from '@/lib/adminAuth';
import User from '@/models/User';
import Artwork from '@/models/Artwork';
import Order from '@/models/Order';

export async function GET() {
  try {
    // Verify the current database role on every request.
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const [
      totalUsers,
      buyers,
      artists,
      admins,
      totalArtworks,
      availableArtworks,
      unavailableArtworks,
      totalOrders,
      newOrders,
      inProgressOrders,
      paidOrderValueResult,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({ role: 'buyer' }),

      User.countDocuments({ role: 'artist' }),

      User.countDocuments({ role: 'admin' }),

      Artwork.countDocuments(),

      Artwork.countDocuments({ isAvailable: true }),

      Artwork.countDocuments({ isAvailable: false }),

      Order.countDocuments(),

      Order.countDocuments({ orderStatus: 'placed' }),

      Order.countDocuments({
        orderStatus: {
          $in: ['confirmed', 'shipped'],
        },
      }),

      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$total',
            },
          },
        },
      ]),
    ]);

    const paidOrderValue =
      paidOrderValueResult[0]?.total ?? 0;

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          buyers,
          artists,
          admins,
          totalArtworks,
          availableArtworks,
          unavailableArtworks,
          totalOrders,
          newOrders,
          inProgressOrders,
          paidOrderValue,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/admin/overview]', error);

    return NextResponse.json(
      { error: 'Failed to load admin overview' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}