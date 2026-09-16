import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import Artwork from '@/models/Artwork';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const artwork = await Artwork.findById(id)
      .populate(
        'artist',
        'name profileImage location rating bio socialLinks'
      )
      .populate('reviews.user', 'name profileImage');

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Increment views after successfully finding the artwork.
    await Artwork.findByIdAndUpdate(id, {
      $inc: { views: 1 },
    });

    return NextResponse.json(artwork);
  } catch (err) {
    console.error('[GET /api/artworks/[id]]', err);

    return NextResponse.json(
      { error: 'Failed to fetch artwork' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await req.json();

    const artwork = await Artwork.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(artwork);
  } catch (err) {
    console.error('[PATCH /api/artworks/[id]]', err);

    return NextResponse.json(
      { error: 'Failed to update artwork' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const artwork = await Artwork.findByIdAndDelete(id);

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Artwork deleted successfully',
    });
  } catch (err) {
    console.error('[DELETE /api/artworks/[id]]', err);

    return NextResponse.json(
      { error: 'Failed to delete artwork' },
      { status: 500 }
    );
  }
}