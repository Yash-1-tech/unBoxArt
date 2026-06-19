import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';

// GET /api/artworks — list with filters & pagination
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = { isAvailable: true };

    const medium = searchParams.get('medium');
    const subject = searchParams.get('subject');
    const style = searchParams.get('style');
    const artist = searchParams.get('artist');
    const collection = searchParams.get('collection');
    const q = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (medium) query.medium = { $regex: medium, $options: 'i' };
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (style) query.style = { $regex: style, $options: 'i' };
    if (artist) query.artist = artist;
    if (collection === 'curators-picks') query.isCuratorsPick = true;
    if (collection === 'featured') query.isFeatured = true;
    if (collection === 'trending') query.isTrending = true;
    if (q) query.$text = { $search: q };
    if (minPrice || maxPrice) {
      query.originalPrice = {};
      if (minPrice) (query.originalPrice as Record<string, number>).$gte = parseInt(minPrice);
      if (maxPrice) (query.originalPrice as Record<string, number>).$lte = parseInt(maxPrice);
    }

    // Sort
    const sortParam = searchParams.get('sort') || 'newest';
    const sortMap: Record<string, Record<string, number>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { originalPrice: 1 },
      'price-desc': { originalPrice: -1 },
      popular: { views: -1 },
      'most-liked': { likes: -1 },
    };
    const sort = sortMap[sortParam] || sortMap.newest;

    const [artworks, total] = await Promise.all([
      Artwork.find(query)
        .populate('artist', 'name profileImage location rating')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Artwork.countDocuments(query),
    ]);

    return NextResponse.json({
      artworks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + artworks.length < total,
    });
  } catch (err) {
    console.error('[GET /api/artworks]', err);
    return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
  }
}

// POST /api/artworks — create new artwork
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Generate unique code
    const count = await Artwork.countDocuments();
    body.code = `HF-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

    const artwork = await Artwork.create(body);
    return NextResponse.json(artwork, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/artworks]', err);
    const message = err instanceof Error ? err.message : 'Failed to create artwork';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
