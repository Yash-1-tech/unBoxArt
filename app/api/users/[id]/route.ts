import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';
import User from '@/models/User';
import Artwork from '@/models/Artwork';

const isValidId = (id: string) => /^[a-f\d]{24}$/i.test(id);

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    await connectDB();

    // Return only fields intended for public profile display.
    const user = await User.findById(id)
      .select(
        '_id name role profileImage bio location rating reviewCount isVerified'
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: noStoreHeaders }
      );
    }

    // Only artist profiles have publicly displayed artworks.
    const artworks =
      user.role === 'artist'
        ? await Artwork.find({
            artist: id,
            isAvailable: true,
          })
            .select(
              '_id title code description images medium subject style dimensions originalPrice digitalPrintPrice shippingCost stock isAvailable avgRating reviewCount createdAt'
            )
            .sort({ createdAt: -1 })
            .lean()
        : [];

    return NextResponse.json(
      { user, artworks },
      { headers: noStoreHeaders }
    );
  } catch (err) {
    console.error('[GET /api/users/[id]]', err);

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Require an authenticated session.
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const sessionUserId = session.user?.id;

    if (!sessionUserId || !isValidId(sessionUserId)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: noStoreHeaders }
      );
    }

    // Users can update only their own profiles.
    if (sessionUserId.toLowerCase() !== id.toLowerCase()) {
      return NextResponse.json(
        { error: 'You are not authorized to update this profile' },
        { status: 403, headers: noStoreHeaders }
      );
    }

    await connectDB();

    // Safely parse and validate the request body.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const input = body as Record<string, unknown>;
    const allowedFields = ['name', 'bio', 'location'];

    // Reject attempts to change protected or unsupported fields.
    if (Object.keys(input).some((key) => !allowedFields.includes(key))) {
      return NextResponse.json(
        { error: 'One or more profile fields are not allowed' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const updates: {
      name?: string;
      bio?: string;
      location?: string;
    } = {};

    if ('name' in input) {
      if (typeof input.name !== 'string') {
        return NextResponse.json(
          { error: 'Name must be a string' },
          { status: 400, headers: noStoreHeaders }
        );
      }

      const name = input.name.trim();

      if (!name || name.length > 100) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 100 characters' },
          { status: 400, headers: noStoreHeaders }
        );
      }

      updates.name = name;
    }

    if ('bio' in input) {
      if (typeof input.bio !== 'string') {
        return NextResponse.json(
          { error: 'Bio must be a string' },
          { status: 400, headers: noStoreHeaders }
        );
      }

      const bio = input.bio.trim();

      if (bio.length > 1000) {
        return NextResponse.json(
          { error: 'Bio cannot exceed 1000 characters' },
          { status: 400, headers: noStoreHeaders }
        );
      }

      updates.bio = bio;
    }

    if ('location' in input) {
      if (typeof input.location !== 'string') {
        return NextResponse.json(
          { error: 'Location must be a string' },
          { status: 400, headers: noStoreHeaders }
        );
      }

      const location = input.location.trim();

      if (location.length > 150) {
        return NextResponse.json(
          { error: 'Location cannot exceed 150 characters' },
          { status: 400, headers: noStoreHeaders }
        );
      }

      updates.location = location;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No profile changes provided' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      '_id name email role profileImage bio location rating reviewCount isVerified membershipTier'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: noStoreHeaders }
      );
    }

    return NextResponse.json(user, {
      headers: noStoreHeaders,
    });
  } catch (err) {
    console.error('[PATCH /api/users/[id]]', err);

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
