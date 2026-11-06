
import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/lib/adminAuth';
import Artwork from '@/models/Artwork';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: noStoreHeaders,
    }
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '20');
    const status = searchParams.get('status') ?? 'all';
    const collection = searchParams.get('collection') ?? 'all';
    const search = (searchParams.get('search') ?? '').trim();

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 50 ||
      !Number.isSafeInteger((page - 1) * limit)
    ) {
      return jsonError('Invalid pagination parameters', 400);
    }

    if (!['all', 'available', 'unavailable'].includes(status)) {
      return jsonError('Invalid availability filter', 400);
    }

    if (
      !['all', 'featured', 'curators-pick', 'trending'].includes(
        collection
      )
    ) {
      return jsonError('Invalid collection filter', 400);
    }

    if (search.length > 100) {
      return jsonError(
        'Search must not exceed 100 characters',
        400
      );
    }

    const query: Record<string, unknown> = {};

    if (status === 'available') {
      query.isAvailable = true;
    } else if (status === 'unavailable') {
      query.isAvailable = false;
    }

    if (collection === 'featured') {
      query.isFeatured = true;
    } else if (collection === 'curators-pick') {
      query.isCuratorsPick = true;
    } else if (collection === 'trending') {
      query.isTrending = true;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { code: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [artworks, total] = await Promise.all([
      Artwork.find(query)
        .select(
          '_id title code images artist medium originalPrice shippingCost stock isAvailable isFeatured isCuratorsPick isTrending createdAt updatedAt'
        )
        .populate('artist', 'name email profileImage')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Artwork.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        artworks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[GET /api/admin/artworks]', error);

    return jsonError('Failed to fetch artworks', 500);
  }
}
