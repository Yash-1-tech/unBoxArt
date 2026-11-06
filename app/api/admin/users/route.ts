import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/lib/adminAuth';
import User from '@/models/User';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: noStoreHeaders,
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { searchParams } = new URL(req.url);

    const pageParam = searchParams.get('page') ?? '1';
    const limitParam = searchParams.get('limit') ?? '20';
    const role = searchParams.get('role') ?? 'all';
    const verification = searchParams.get('verification') ?? 'all';
    const search = (searchParams.get('search') ?? '').trim();

    const page = Number(pageParam);
    const limit = Number(limitParam);

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

    if (!['all', 'buyer', 'artist', 'admin'].includes(role)) {
      return jsonError('Invalid role filter', 400);
    }

    if (
      !['all', 'verified', 'unverified'].includes(verification)
    ) {
      return jsonError('Invalid verification filter', 400);
    }

    if (search.length > 100) {
      return jsonError(
        'Search must not exceed 100 characters',
        400
      );
    }

    const query: Record<string, unknown> = {};

    if (role !== 'all') {
      query.role = role;
    }

    if (verification === 'verified') {
      query.isVerified = true;
    } else if (verification === 'unverified') {
      query.isVerified = false;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        {
          name: {
            $regex: safeSearch,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: safeSearch,
            $options: 'i',
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          '_id name email role profileImage isVerified membershipTier location createdAt'
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        users,
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
    console.error('[GET /api/admin/users]', error);

    return jsonError('Failed to fetch users', 500);
  }
}