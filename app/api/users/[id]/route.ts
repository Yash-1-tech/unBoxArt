import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Artwork from '@/models/Artwork';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const [user, artworks] = await Promise.all([
      User.findById(id).select('-password').lean(),
      Artwork.find({
        artist: id,
        isAvailable: true,
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      artworks,
    });
  } catch (err) {
    console.error('[GET /api/users/[id]]', err);

    return NextResponse.json(
      { error: 'Failed to fetch user' },
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

    delete body.password;
    delete body.role;

    const user = await User.findByIdAndUpdate(
      id,
      body,
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('[PATCH /api/users/[id]]', err);

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}