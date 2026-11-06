import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import Artwork from '@/models/Artwork';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

type RouteContext = {
  params: Promise<{ id: string }>;
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

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { id } = await context.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return jsonError('Invalid artwork ID', 400);
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return jsonError('Invalid request body', 400);
    }

    const payload = body as Record<string, unknown>;
    const allowedFields = [
      'isAvailable',
      'isFeatured',
      'isCuratorsPick',
      'isTrending',
    ];

    const keys = Object.keys(payload);

    if (
      keys.length === 0 ||
      keys.some((key) => !allowedFields.includes(key))
    ) {
      return jsonError('Invalid artwork update fields', 400);
    }

    const updates: Record<string, boolean> = {};

    for (const key of keys) {
      const value = payload[key];

      if (typeof value !== 'boolean') {
        return jsonError(
          `${key} must be true or false`,
          400
        );
      }

      updates[key] = value;
    }

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      id,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        '_id title code images artist medium originalPrice shippingCost stock isAvailable isFeatured isCuratorsPick isTrending createdAt updatedAt'
      )
      .populate('artist', 'name email profileImage')
      .lean();

    if (!updatedArtwork) {
      return jsonError('Artwork not found', 404);
    }

    return NextResponse.json(
      {
        message: 'Artwork updated successfully',
        artwork: updatedArtwork,
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[PATCH /api/admin/artworks/[id]]', error);

    return jsonError('Failed to update artwork', 500);
  }
}
