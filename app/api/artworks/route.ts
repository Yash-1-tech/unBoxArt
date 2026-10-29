import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import Artwork from '@/models/Artwork';
import User from '@/models/User';
import { sessionOptions, type SessionData } from '@/lib/session';


function getCloudinaryPublicId(
  imageUrl: string,
  cloudName: string
): string | null {
  try {
    const url = new URL(imageUrl);

    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'res.cloudinary.com'
    ) {
      return null;
    }

    const prefix = `/${cloudName}/image/upload/`;

    if (!url.pathname.startsWith(prefix)) {
      return null;
    }

    const parts = url.pathname
      .slice(prefix.length)
      .split('/')
      .filter(Boolean);

    const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));

    if (versionIndex === -1) {
      return null;
    }

    const assetParts = parts
      .slice(versionIndex + 1)
      .map((part) => decodeURIComponent(part));

    if (assetParts.length === 0) {
      return null;
    }

    const lastIndex = assetParts.length - 1;
    assetParts[lastIndex] = assetParts[lastIndex].replace(/\.[^.]+$/, '');

    return assetParts.join('/') || null;
  } catch {
    return null;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const page = pageParam === null ? 1 : Number(pageParam);
    const limit = limitParam === null ? 12 : Number(limitParam);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 48 ||
      !Number.isSafeInteger((page - 1) * limit)
    ) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

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

    const searchFilters = [
      { name: 'medium', value: medium },
      { name: 'subject', value: subject },
      { name: 'style', value: style },
      { name: 'q', value: q },
    ];

    if (searchFilters.some(({ value }) => value !== null && value.length > 100)) {
      return NextResponse.json(
        { error: 'Search filters must not exceed 100 characters' },
        { status: 400 }
      );
    }
    
    if (medium) {
      query.medium = { $regex: escapeRegex(medium), $options: 'i' };
    }
    if (subject) {
      query.subject = { $regex: escapeRegex(subject), $options: 'i' };
    }
    if (style) {
      query.style = { $regex: escapeRegex(style), $options: 'i' };
    }

    if (artist) {
      if (!/^[a-fA-F0-9]{24}$/.test(artist)) {
        return NextResponse.json(
          { error: 'Invalid artist filter' },
          { status: 400 }
        );
      }

      query.artist = artist;
    }
    if (collection === 'curators-picks') query.isCuratorsPick = true;
    if (collection === 'featured') query.isFeatured = true;
    if (collection === 'trending') query.isTrending = true;
    if (q) {
      const safeSearch = escapeRegex(q);

      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { medium: { $regex: safeSearch, $options: 'i' } },
        { subject: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    
    const parsedMinPrice = minPrice === null ? undefined : Number(minPrice);
    const parsedMaxPrice = maxPrice === null ? undefined : Number(maxPrice);

    if (
      (minPrice !== null &&
        (!minPrice.trim() ||
          !Number.isFinite(parsedMinPrice) ||
          parsedMinPrice! < 0)) ||
      (maxPrice !== null &&
        (!maxPrice.trim() ||
          !Number.isFinite(parsedMaxPrice) ||
          parsedMaxPrice! < 0))
    ) {
      return NextResponse.json(
        { error: 'Price filters must be valid non-negative numbers' },
        { status: 400 }
      );
    }

    if (
      parsedMinPrice !== undefined &&
      parsedMaxPrice !== undefined &&
      parsedMinPrice > parsedMaxPrice
    ) {
      return NextResponse.json(
        { error: 'Minimum price cannot exceed maximum price' },
        { status: 400 }
      );
    }

    if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
      const priceQuery: Record<string, number> = {};

      if (parsedMinPrice !== undefined) {
        priceQuery.$gte = parsedMinPrice;
      }

      if (parsedMaxPrice !== undefined) {
        priceQuery.$lte = parsedMaxPrice;
      }

      query.originalPrice = priceQuery;
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

    // Validate image count and types.
    if (
      !Array.isArray(images) ||
      images.length === 0 ||
      images.length > 6 ||
      !images.every((image: unknown) => typeof image === 'string')
    ) {
      return NextResponse.json(
        { error: 'Provide between 1 and 6 valid image URLs' },
        { status: 400 }
      );
    }

    const imageUrls = images as string[];

    if (new Set(imageUrls).size !== imageUrls.length) {
      return NextResponse.json(
        { error: 'Duplicate image URLs are not allowed' },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured on the server' },
        { status: 503 }
      );
    }

    const publicIds = imageUrls.map((imageUrl) =>
      getCloudinaryPublicId(imageUrl, cloudName)
    );

    if (publicIds.some((id) => id === null)) {
      return NextResponse.json(
        { error: 'Images must use valid URLs from your Cloudinary account' },
        { status: 400 }
      );
    }

    const cloudinary = (await import('cloudinary')).v2;

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Verify that every asset exists and belongs to this artist.
    const resourceResults = await Promise.allSettled(
      (publicIds as string[]).map((publicId) =>
        cloudinary.api.resource(publicId, {
          resource_type: 'image',
        })
      )
    );

    if (resourceResults.some((result) => result.status === 'rejected')) {
      console.error(
        '[POST /api/artworks] Failed to verify Cloudinary assets',
        resourceResults
          .filter((result) => result.status === 'rejected')
          .map((result) =>
            result.status === 'rejected' ? result.reason : undefined
          )
      );

      return NextResponse.json(
        { error: 'One or more images could not be verified' },
        { status: 400 }
      );
    }

    const artistTag = `artist_${artist._id.toString()}`;

    const ownsAllImages = resourceResults.every(
      (result) =>
        result.status === 'fulfilled' &&
        Array.isArray(result.value.tags) &&
        result.value.tags.includes(artistTag)
    );

    if (!ownsAllImages) {
      return NextResponse.json(
        { error: 'You can only publish images uploaded by your artist account' },
        { status: 403 }
      );
    }

    // Generate unique artwork code
    const count = await Artwork.countDocuments();

    const code = `HF-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

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