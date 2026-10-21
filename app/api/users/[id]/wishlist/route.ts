
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    await connectDB();

    const { artworkId } = await req.json();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isWishlisted = user.wishlist.some(
      (wishlistId) => wishlistId.toString() === artworkId
    );

    if (isWishlisted) {
      user.wishlist = user.wishlist.filter(
        (wishlistId) => wishlistId.toString() !== artworkId
      );
    } else {
      user.wishlist.push(artworkId);
    }

    await user.save();

    return NextResponse.json({
      wishlisted: !isWishlisted,
      count: user.wishlist.length,
    });
  } catch (err) {
    console.error('Failed to update wishlist:', err);

    return NextResponse.json(
      { error: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    await connectDB();

    const user = await User.findById(id)
      .populate(
        'wishlist',
        'title images originalPrice digitalPrintPrice artist medium dimensions'
      )
      .select('wishlist');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      wishlist: user.wishlist,
    });
  } catch (err) {
    console.error('Failed to fetch wishlist:', err);

    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}
