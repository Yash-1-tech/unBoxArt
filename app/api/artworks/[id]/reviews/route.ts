import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';

// POST /api/artworks/[id]/reviews
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { userId, rating, comment } = await req.json();

    if (!userId || !rating) {
      return NextResponse.json({ error: 'userId and rating are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const artwork = await Artwork.findById(params.id);
    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // Prevent duplicate reviews from same user
    const alreadyReviewed = artwork.reviews.some(
      (r) => r.user.toString() === userId
    );
    if (alreadyReviewed) {
      return NextResponse.json({ error: 'You have already reviewed this artwork' }, { status: 400 });
    }

    artwork.reviews.push({ user: userId, rating, comment, createdAt: new Date() });

    // Recalculate average
    const total = artwork.reviews.reduce((sum, r) => sum + r.rating, 0);
    artwork.avgRating = Math.round((total / artwork.reviews.length) * 10) / 10;
    artwork.reviewCount = artwork.reviews.length;

    await artwork.save();
    return NextResponse.json({ avgRating: artwork.avgRating, reviewCount: artwork.reviewCount }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/artworks/[id]/reviews]', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
