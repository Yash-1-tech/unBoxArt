import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';
import User from '@/models/User';

// GET /api/search?q=query&type=all|artworks|artists&limit=8
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!q || q.length < 2) {
      return NextResponse.json({ artworks: [], artists: [] });
    }

    const regex = { $regex: q, $options: 'i' };

    const [artworks, artists] = await Promise.all([
      type !== 'artists'
        ? Artwork.find({
            isAvailable: true,
            $or: [
              { title: regex },
              { medium: regex },
              { subject: regex },
              { style: regex },
              { tags: regex },
              { description: regex },
            ],
          })
            .populate('artist', 'name')
            .select('title images originalPrice medium dimensions artist avgRating')
            .limit(limit)
            .lean()
        : Promise.resolve([]),

      type !== 'artworks'
        ? User.find({
            role: 'artist',
            $or: [{ name: regex }, { location: regex }, { bio: regex }],
          })
            .select('name profileImage location rating totalSales')
            .limit(4)
            .lean()
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ artworks, artists, query: q });
  } catch (err) {
    console.error('[GET /api/search]', err);
    return NextResponse.json({ artworks: [], artists: [], error: 'Search failed' });
  }
}
