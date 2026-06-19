import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// POST /api/users/[id]/wishlist  { artworkId }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { artworkId } = await req.json();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isWishlisted = user.wishlist.some((id) => id.toString() === artworkId);

    if (isWishlisted) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== artworkId);
    } else {
      user.wishlist.push(artworkId);
    }

    await user.save();
    return NextResponse.json({ wishlisted: !isWishlisted, count: user.wishlist.length });
  } catch (err) {
    console.error('[POST /api/users/[id]/wishlist]', err);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}

// GET /api/users/[id]/wishlist
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await User.findById(params.id)
      .populate('wishlist', 'title images originalPrice digitalPrintPrice artist medium dimensions')
      .select('wishlist');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ wishlist: user.wishlist });
  } catch (err) {
    console.error('[GET /api/users/[id]/wishlist]', err);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}
