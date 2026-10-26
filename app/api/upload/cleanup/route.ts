
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request.
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
        { error: 'Only artist accounts can clean up artwork uploads' },
        { status: 403 }
      );
    }

    if (!session.user.id) {
      return NextResponse.json(
        { error: 'Artist account ID is missing from the session' },
        { status: 401 }
      );
    }

    // Validate the submitted public IDs.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || !('publicIds' in body)) {
      return NextResponse.json(
        { error: 'An array of publicIds is required' },
        { status: 400 }
      );
    }

    const publicIds = (body as { publicIds?: unknown }).publicIds;

    if (
      !Array.isArray(publicIds) ||
      publicIds.length === 0 ||
      publicIds.length > 6 ||
      !publicIds.every(
        (id): id is string =>
          typeof id === 'string' &&
          id.trim().length > 0 &&
          id.length <= 255
      )
    ) {
      return NextResponse.json(
        { error: 'Provide between 1 and 6 valid Cloudinary public IDs' },
        { status: 400 }
      );
    }

    if (new Set(publicIds).size !== publicIds.length) {
      return NextResponse.json(
        { error: 'Duplicate public IDs are not allowed' },
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

    const cloudinary = (await import('cloudinary')).v2;

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const artistTag = `artist_${session.user.id}`;

    const results = await Promise.allSettled(
      publicIds.map(async (publicId: string) => {
        // Look up the asset using Cloudinary's authenticated Admin API.
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: 'image',
        });

        // Never delete an asset unless its ownership tag matches.
        const tags: string[] = Array.isArray(resource.tags)
          ? resource.tags
          : [];

        if (!tags.includes(artistTag)) {
          return false;
        }

        const deletion = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
          invalidate: true,
        });

        return deletion.result === 'ok';
      })
    );

    const cleanedCount = results.filter(
      (result) =>
        result.status === 'fulfilled' && result.value === true
    ).length;

    const failedCount = results.filter(
      (result) => result.status === 'rejected'
    ).length;

    if (failedCount > 0) {
      console.error(
        '[POST /api/upload/cleanup] Some cleanup operations failed',
        results
          .filter((result) => result.status === 'rejected')
          .map((result) =>
            result.status === 'rejected' ? result.reason : undefined
          )
      );
    }

    return NextResponse.json(
      {
        cleanedCount,
        failedCount,
      },
      { status: failedCount > 0 ? 502 : 200 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/upload/cleanup]', err);

    return NextResponse.json(
      { error: 'Unable to clean up uploaded images' },
      { status: 500 }
    );
  }
}
