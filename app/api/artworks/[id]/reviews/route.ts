
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';
import Order from '@/models/Order';
import User from '@/models/User';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate the artwork ID.
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid artwork ID' },
        { status: 400 }
      );
    }

    // Authenticate the reviewer.
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can submit reviews' },
        { status: 403 }
      );
    }

    if (
      typeof session.user.id !== 'string' ||
      !/^[a-fA-F0-9]{24}$/.test(session.user.id)
    ) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    await connectDB();

    // Confirm the buyer account still exists and has the correct role.
    const reviewer = await User.findById(session.user.id)
      .select('_id role');

    if (!reviewer) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 401 }
      );
    }

    if (reviewer.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can submit reviews' },
        { status: 403 }
      );
    }

    // Parse and validate the request body.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: 'Invalid review data' },
        { status: 400 }
      );
    }

    const reviewData = body as Record<string, unknown>;
    const { rating, comment } = reviewData;

    if (
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (
      comment !== undefined &&
      comment !== null &&
      typeof comment !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Comment must be a string' },
        { status: 400 }
      );
    }

    const normalizedComment =
      typeof comment === 'string' ? comment.trim() : '';

    if (normalizedComment.length > 1000) {
      return NextResponse.json(
        { error: 'Comment cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Find the artwork.
    const artwork = await Artwork.findById(id).select('artist');

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Prevent artists from reviewing their own artwork.
    if (String(artwork.artist) === reviewer._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot review your own artwork' },
        { status: 403 }
      );
    }

    // Require a paid, delivered order containing this artwork.
    // Exclude orders with a pending or processed refund.
    const eligibleOrder = await Order.exists({
      buyer: reviewer._id,
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      refundStatus: { $nin: ['pending', 'processed'] },
      'items.artwork': id,
    });

    if (!eligibleOrder) {
      return NextResponse.json(
        {
          error:
            'You can review this artwork only after a paid order has been delivered and is not being refunded',
        },
        { status: 403 }
      );
    }

    // Atomically add the review only if this buyer has not reviewed
    // this artwork before. Ignore any userId supplied by the client.
    const updatedArtwork = await Artwork.findOneAndUpdate(
      {
        _id: id,
        'reviews.user': { $ne: reviewer._id },
      },
      {
        $push: {
          reviews: {
            user: reviewer._id,
            rating,
            ...(normalizedComment
              ? { comment: normalizedComment }
              : {}),
            createdAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedArtwork) {
      // Determine whether the artwork disappeared or the buyer
      // already submitted a review.
      const artworkExists = await Artwork.exists({ _id: id });

      if (!artworkExists) {
        return NextResponse.json(
          { error: 'Artwork not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'You have already reviewed this artwork' },
        { status: 409 }
      );
    }

    // Recalculate rating statistics from the saved reviews.
    await Artwork.updateOne(
      { _id: id },
      [
        {
          $set: {
            reviewCount: {
              $size: { $ifNull: ['$reviews', []] },
            },
            avgRating: {
              $round: [{ $avg: '$reviews.rating' }, 1],
            },
          },
        },
      ]
    );

    const stats = await Artwork.findById(id)
      .select('avgRating reviewCount')
      .lean();

    return NextResponse.json(
      {
        avgRating: stats?.avgRating ?? 0,
        reviewCount: stats?.reviewCount ?? 0,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/artworks/[id]/reviews]', err);

    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
