
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import User from '@/models/User';
import Artwork from '@/models/Artwork';
import Order from '@/models/Order';

import { connectDB } from '@/lib/db';
import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders,
  });
}

function isValidArtworkId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

type ArtistAuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

async function getVerifiedArtist(): Promise<ArtistAuthResult> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  const sessionUserId = session.user?.id;

  if (
    !sessionUserId ||
    !isValidArtworkId(sessionUserId)
  ) {
    return {
      ok: false,
      response: jsonResponse(
        { error: 'Authentication required' },
        401
      ),
    };
  }

  if (session.user?.role !== 'artist') {
    return {
      ok: false,
      response: jsonResponse(
        { error: 'Only artists can perform this action' },
        403
      ),
    };
  }

  const currentUser = await User.findById(sessionUserId)
    .select('_id role')
    .lean();

  if (!currentUser) {
    session.destroy();

    return {
      ok: false,
      response: jsonResponse(
        { error: 'Artist account not found. Please sign in again.' },
        401
      ),
    };
  }

  if (currentUser.role !== 'artist') {
    session.destroy();

    return {
      ok: false,
      response: jsonResponse(
        { error: 'Only artist accounts can perform this action' },
        403
      ),
    };
  }

  return {
    ok: true,
    userId: currentUser._id.toString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

// GET /api/artworks/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidArtworkId(id)) {
      return jsonResponse(
        { error: 'Invalid artwork ID' },
        400
      );
    }

    await connectDB();

    const artwork = await Artwork.findById(id)
      .populate(
        'artist',
        'name profileImage location rating bio socialLinks'
      )
      .populate('reviews.user', 'name profileImage');

    if (!artwork) {
      return jsonResponse(
        { error: 'Artwork not found' },
        404
      );
    }

    // Unavailable artwork must not be publicly accessible.
    // Only its owning artist may view it.
    if (!artwork.isAvailable) {
      const auth = await getVerifiedArtist();

      if (!auth.ok) {
        return jsonResponse(
          { error: 'Artwork not found' },
          404
        );
      }

      const populatedArtist = artwork.artist as unknown as
        | { _id?: { toString(): string } }
        | null;

      const ownerId = populatedArtist?._id
        ? populatedArtist._id.toString()
        : String(artwork.artist);

      if (ownerId !== auth.userId) {
        return jsonResponse(
          { error: 'Artwork not found' },
          404
        );
      }
    }

    // Only count publicly available artwork views.
    if (artwork.isAvailable) {
      await Artwork.updateOne(
        { _id: id, isAvailable: true },
        { $inc: { views: 1 } }
      );
    }

    return jsonResponse(artwork);
  } catch (err) {
    console.error('[GET /api/artworks/[id]]', err);

    return jsonResponse(
      { error: 'Failed to fetch artwork' },
      500
    );
  }
}

// PATCH /api/artworks/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidArtworkId(id)) {
      return jsonResponse(
        { error: 'Invalid artwork ID' },
        400
      );
    }

    await connectDB();

    const auth = await getVerifiedArtist();

    if (!auth.ok) {
      return auth.response;
    }

    const artwork = await Artwork.findById(id);

    if (!artwork) {
      return jsonResponse(
        { error: 'Artwork not found' },
        404
      );
    }

    // Verify ownership.
    if (String(artwork.artist) !== auth.userId) {
      return jsonResponse(
        { error: 'You are not authorized to edit this artwork' },
        403
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: 'Invalid JSON request body' },
        400
      );
    }

    if (!isRecord(body)) {
      return jsonResponse(
        { error: 'Invalid update data' },
        400
      );
    }

    const editableFields = new Set([
      'title',
      'description',
      'medium',
      'subject',
      'style',
      'dimensions',
      'originalPrice',
      'digitalPrintPrice',
      'shippingCost',
      'stock',
      'isAvailable',
    ]);

    // Reject unknown or protected fields instead of silently ignoring them.
    if (
      Object.keys(body).some(
        (key) => !editableFields.has(key)
      )
    ) {
      return jsonResponse(
        { error: 'One or more fields cannot be edited' },
        400
      );
    }

    const updates: Record<string, unknown> = {};

    const allowedMediums = [
      'Acrylic',
      'Oil',
      'Watercolor',
      'Pencil',
      'Digital',
      'Mixed Media',
    ];

    const allowedSubjects = [
      'Abstract',
      'Landscape',
      'Portrait',
      'Still Life',
      'Wildlife',
      'Religious',
    ];

    const allowedStyles = [
      'Modern',
      'Contemporary',
      'Impressionist',
      'Realist',
      'Expressionist',
    ];

    if ('title' in body) {
      if (
        typeof body.title !== 'string' ||
        !body.title.trim()
      ) {
        return jsonResponse(
          { error: 'A valid artwork title is required' },
          400
        );
      }

      updates.title = body.title.trim();
    }

    if ('description' in body) {
      if (typeof body.description !== 'string') {
        return jsonResponse(
          { error: 'Description must be a string' },
          400
        );
      }

      updates.description = body.description.trim();
    }

    if ('medium' in body) {
      if (
        typeof body.medium !== 'string' ||
        !allowedMediums.includes(body.medium)
      ) {
        return jsonResponse(
          { error: 'Invalid artwork medium' },
          400
        );
      }

      updates.medium = body.medium;
    }

    if ('subject' in body) {
      if (
        typeof body.subject !== 'string' ||
        !allowedSubjects.includes(body.subject)
      ) {
        return jsonResponse(
          { error: 'Invalid artwork subject' },
          400
        );
      }

      updates.subject = body.subject;
    }

    if ('style' in body) {
      if (body.style === '') {
        updates.style = undefined;
      } else if (
        typeof body.style !== 'string' ||
        !allowedStyles.includes(body.style)
      ) {
        return jsonResponse(
          { error: 'Invalid artwork style' },
          400
        );
      } else {
        updates.style = body.style;
      }
    }

    if ('dimensions' in body) {
      if (!isRecord(body.dimensions)) {
        return jsonResponse(
          { error: 'Invalid artwork dimensions' },
          400
        );
      }

      const dimensions = body.dimensions;

      if (
        Object.keys(dimensions).some(
          (key) => !['width', 'height', 'unit'].includes(key)
        )
      ) {
        return jsonResponse(
          { error: 'Invalid dimension fields' },
          400
        );
      }

      const width = dimensions.width;
      const height = dimensions.height;
      const unit = dimensions.unit;

      if (
        typeof width !== 'number' ||
        !Number.isFinite(width) ||
        width <= 0 ||
        typeof height !== 'number' ||
        !Number.isFinite(height) ||
        height <= 0 ||
        (unit !== 'in' && unit !== 'cm')
      ) {
        return jsonResponse(
          { error: 'Width, height, or unit is invalid' },
          400
        );
      }

      updates.dimensions = { width, height, unit };
    }

    const priceFields = [
      'originalPrice',
      'shippingCost',
    ] as const;

    for (const field of priceFields) {
      if (field in body) {
        const value = body[field];

        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < 0
        ) {
          return jsonResponse(
            { error: `${field} must be a valid non-negative number` },
            400
          );
        }

        updates[field] = value;
      }
    }

    if ('digitalPrintPrice' in body) {
      const value = body.digitalPrintPrice;

      if (value === null) {
        updates.digitalPrintPrice = undefined;
      } else if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0
      ) {
        return jsonResponse(
          { error: 'Digital print price must be a valid non-negative number' },
          400
        );
      } else {
        updates.digitalPrintPrice = value;
      }
    }

    if ('stock' in body) {
      const stock = body.stock;

      if (
        typeof stock !== 'number' ||
        !Number.isSafeInteger(stock) ||
        stock < 0
      ) {
        return jsonResponse(
          { error: 'Stock must be a non-negative integer' },
          400
        );
      }

      updates.stock = stock;
    }

    if ('isAvailable' in body) {
      if (typeof body.isAvailable !== 'boolean') {
        return jsonResponse(
          { error: 'Availability must be true or false' },
          400
        );
      }

      updates.isAvailable = body.isAvailable;
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse(
        { error: 'No permitted fields provided for update' },
        400
      );
    }

    artwork.set(updates);

    const updatedArtwork = await artwork.save();

    return jsonResponse(updatedArtwork);
  } catch (err) {
    console.error('[PATCH /api/artworks/[id]]', err);

    if (
      err instanceof Error &&
      err.name === 'ValidationError'
    ) {
      return jsonResponse(
        { error: 'Artwork data failed validation' },
        400
      );
    }

    return jsonResponse(
      { error: 'Failed to update artwork' },
      500
    );
  }
}

// DELETE /api/artworks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidArtworkId(id)) {
      return jsonResponse(
        { error: 'Invalid artwork ID' },
        400
      );
    }

    await connectDB();

    const auth = await getVerifiedArtist();

    if (!auth.ok) {
      return auth.response;
    }

    const artwork = await Artwork.findById(id);

    if (!artwork) {
      return jsonResponse(
        { error: 'Artwork not found' },
        404
      );
    }

    // Verify ownership.
    if (String(artwork.artist) !== auth.userId) {
      return jsonResponse(
        { error: 'You are not authorized to delete this artwork' },
        403
      );
    }

    // Preserve artwork records needed by historical orders.
    const hasOrderHistory = await Order.exists({
      'items.artwork': artwork._id,
    });

    if (hasOrderHistory) {
      return jsonResponse(
        {
          error:
            'This artwork has order history and cannot be deleted. Mark it unavailable instead.',
        },
        409
      );
    }

    await Artwork.findByIdAndDelete(id);

    return jsonResponse({
      message: 'Artwork deleted successfully',
    });
  } catch (err) {
    console.error('[DELETE /api/artworks/[id]]', err);

    return jsonResponse(
      { error: 'Failed to delete artwork' },
      500
    );
  }
}
