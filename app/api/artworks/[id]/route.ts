import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';
import { sessionOptions, type SessionData } from '@/lib/session';

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

    // Get authenticated user from server-side session
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

    if (session.user.role !== 'artist') {
      return NextResponse.json(
        { error: 'Only artists can edit artwork' },
        { status: 403 }
      );
    }

    const artwork = await Artwork.findById(id);

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Only the artist who owns the artwork can edit it
    if (artwork.artist.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to edit this artwork' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Never allow ownership to be changed through PATCH
    delete body.artist;
    delete body.code;

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedArtwork);
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

    // Get authenticated user from server-side session
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

    if (session.user.role !== 'artist') {
      return NextResponse.json(
        { error: 'Only artists can delete artwork' },
        { status: 403 }
      );
    }

    const artwork = await Artwork.findById(id);

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Only the artist who owns the artwork can delete it
    if (artwork.artist.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this artwork' },
        { status: 403 }
      );
    }

    await Artwork.findByIdAndDelete(id);

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