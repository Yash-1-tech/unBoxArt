import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';
import User from '@/models/User';
import { sessionOptions, type SessionData } from '@/lib/session';


export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

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
    if (q) query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { medium: { $regex: q, $options: 'i' } },
      { subject: { $regex: q, $options: 'i' } },
    ];
    if (minPrice || maxPrice) {
      query.originalPrice = {};
      if (minPrice) (query.originalPrice as Record<string, number>).$gte = parseInt(minPrice);
      if (maxPrice) (query.originalPrice as Record<string, number>).$lte = parseInt(maxPrice);
    }

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
    const sortString = Object.entries(sort)
      .map(([field, direction]) =>
        direction === 1 ? field : `-${field}`
      )
      .join(' ');


    const [artworks, total] = await Promise.all([
      Artwork.find(query)
        .populate('artist', 'name profileImage location rating')
        .sort(sortString)
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

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get the authenticated user from the server-side session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Must be logged in
    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only artists can create artworks
    if (session.user.role !== 'artist') {
      return NextResponse.json(
        { error: 'Only artists can upload artwork' },
        { status: 403 }
      );
    }

    // Confirm the artist still exists in the database
    const artist = await User.findById(session.user.id).select('_id role');

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist account not found' },
        { status: 401 }
      );
    }

    if (artist.role !== 'artist') {
      return NextResponse.json(
        { error: 'Only artists can upload artwork' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      medium,
      subject,
      style,
      dimensions,
      originalPrice,
      digitalPrintPrice,
      shippingCost,
      stock,
      images,
    } = body;

    const allowedMediums = [
      'Acrylic',
      'Oil',
      'Watercolor',
      'Pencil',
      'Digital',
      'Mixed Media',
    ];

    const allowedSubjects = [
      'Abstract',
      'Landscape',
      'Portrait',
      'Still Life',
      'Wildlife',
      'Religious',
    ];

    const allowedStyles = [
      'Modern',
      'Contemporary',
      'Impressionist',
      'Realist',
      'Expressionist',
    ];

    // Required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!medium) {
      return NextResponse.json(
        { error: 'Medium is required' },
        { status: 400 }
      );
    }

    if (!allowedMediums.includes(medium)) {
      return NextResponse.json(
        { error: 'Invalid medium selected' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!allowedSubjects.includes(subject)) {
      return NextResponse.json(
        { error: 'Invalid subject selected' },
        { status: 400 }
      );
    }

    if (style && !allowedStyles.includes(style)) {
      return NextResponse.json(
        { error: 'Invalid style selected' },
        { status: 400 }
      );
    }

    // Convert numeric values
    const parsedOriginalPrice = Number(originalPrice);
    const parsedDigitalPrintPrice =
      digitalPrintPrice === undefined ||
      digitalPrintPrice === null ||
      digitalPrintPrice === ''
        ? undefined
        : Number(digitalPrintPrice);

    const parsedShippingCost = Number(shippingCost);
    const parsedStock = Number(stock);

    // Validate prices
    if (
      !Number.isFinite(parsedOriginalPrice) ||
      parsedOriginalPrice < 0
    ) {
      return NextResponse.json(
        { error: 'Original price must be a valid non-negative number' },
        { status: 400 }
      );
    }

    if (
      parsedDigitalPrintPrice !== undefined &&
      (!Number.isFinite(parsedDigitalPrintPrice) ||
        parsedDigitalPrintPrice < 0)
    ) {
      return NextResponse.json(
        { error: 'Digital print price must be a valid non-negative number' },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(parsedShippingCost) ||
      parsedShippingCost < 0
    ) {
      return NextResponse.json(
        { error: 'Shipping cost must be a valid non-negative number' },
        { status: 400 }
      );
    }

    // Validate stock
    if (
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return NextResponse.json(
        { error: 'Stock must be a non-negative integer' },
        { status: 400 }
      );
    }

    // Validate dimensions
    if (!dimensions) {
      return NextResponse.json(
        { error: 'Dimensions are required' },
        { status: 400 }
      );
    }

    const width = Number(dimensions.width);
    const height = Number(dimensions.height);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return NextResponse.json(
        { error: 'Width and height must be greater than 0' },
        { status: 400 }
      );
    }

    if (!['in', 'cm'].includes(dimensions.unit)) {
      return NextResponse.json(
        { error: 'Invalid dimension unit' },
        { status: 400 }
      );
    }

    // Validate images
    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Generate unique artwork code
    const count = await Artwork.countDocuments();

    const code = `HF-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

    // IMPORTANT:
    // artist comes from the authenticated session,
    // NOT from req.body.
    const artwork = await Artwork.create({
      title: title.trim(),
      description: description?.trim() || undefined,

      artist: artist._id,

      medium,
      subject,
      style: style || undefined,

      dimensions: {
        width,
        height,
        unit: dimensions.unit,
      },

      originalPrice: parsedOriginalPrice,
      digitalPrintPrice: parsedDigitalPrintPrice,
      shippingCost: parsedShippingCost,
      stock: parsedStock,

      images,

      code,
    });

    return NextResponse.json(artwork, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/artworks]', err);

    const message =
      err instanceof Error
        ? err.message
        : 'Failed to create artwork';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}