import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';

// POST /api/artworks/[id]/like  { userId }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const artwork = await Artwork.findByIdAndUpdate(
      params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json({ likes: artwork.likes });
  } catch (err) {
    console.error('[POST /api/artworks/[id]/like]', err);
    return NextResponse.json({ error: 'Failed to like artwork' }, { status: 500 });
  }
}
