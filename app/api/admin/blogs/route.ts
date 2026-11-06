
import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/lib/adminAuth';
import Blog from '@/models/Blog';

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

    if (!['all', 'published', 'draft'].includes(status)) {
      return jsonError('Invalid publication status filter', 400);
    }

    if (search.length > 100) {
      return jsonError(
        'Search must not exceed 100 characters',
        400
      );
    }

    const query: Record<string, unknown> = {};

    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        {
          title: {
            $regex: safeSearch,
            $options: 'i',
          },
        },
        {
          slug: {
            $regex: safeSearch,
            $options: 'i',
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select(
          '_id title slug coverImage excerpt author tags isPublished views createdAt updatedAt'
        )
        .populate('author', 'name email profileImage')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Blog.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        blogs,
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
    console.error('[GET /api/admin/blogs]', error);

    return jsonError('Failed to fetch blog posts', 500);
  }
}
