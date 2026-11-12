
import { NextResponse } from 'next/server';

import { getAdminUser } from '@/lib/adminAuth';
import User from '@/models/User';
import Artwork from '@/models/Artwork';
import Order from '@/models/Order';
import Blog from '@/models/Blog';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

export async function GET() {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        {
          status: 403,
          headers: noStoreHeaders,
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
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      blogViewsResult,
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

      Blog.countDocuments(),

      Blog.countDocuments({ isPublished: true }),

      Blog.countDocuments({ isPublished: { $ne: true } }),

      Blog.aggregate([
        {
          $group: {
            _id: null,
            totalViews: {
              $sum: {
                $ifNull: ['$views', 0],
              },
            },
          },
        },
      ]),
    ]);

    const paidOrderValue =
      paidOrderValueResult[0]?.total ?? 0;

    const totalBlogViews =
      blogViewsResult[0]?.totalViews ?? 0;

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

          totalBlogs,
          publishedBlogs,
          draftBlogs,
          totalBlogViews,
        },
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[GET /api/admin/overview]', error);

    return NextResponse.json(
      { error: 'Failed to load admin overview' },
      {
        status: 500,
        headers: noStoreHeaders,
      }
    );
  }
}
