import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';

// GET /api/artworks/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const artwork = await Artwork.findById(params.id)
      .populate('artist', 'name profileImage location rating bio socialLinks')
      .populate('reviews.user', 'name profileImage');

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    Artwork.findByIdAndUpdate(params.id, { $inc: { views: 1 } }).exec();

    return NextResponse.json(artwork);
  } catch (err) {
    console.error('[GET /api/artworks/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch artwork' }, { status: 500 });
  }
}

// PATCH /api/artworks/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const artwork = await Artwork.findByIdAndUpdate(params.id, body, { new: true });

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json(artwork);
  } catch (err) {
    console.error('[PATCH /api/artworks/[id]]', err);
    return NextResponse.json({ error: 'Failed to update artwork' }, { status: 500 });
  }
}

// DELETE /api/artworks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const artwork = await Artwork.findByIdAndDelete(params.id);

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Artwork deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/artworks/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete artwork' }, { status: 500 });
  }
}
