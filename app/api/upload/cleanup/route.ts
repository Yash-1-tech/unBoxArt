import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
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
        { error: 'Only artist accounts can clean up uploads' },
        { status: 403 }
      );
    }

    if (!session.user.id) {
      return NextResponse.json(
        { error: 'Artist account ID is missing from the session' },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid cleanup request' },
        { status: 400 }
      );
    }

    const payload = body as {
      publicIds?: unknown;
      uploadBatchId?: unknown;
    };

    const { publicIds, uploadBatchId } = payload;

    if (
      typeof uploadBatchId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uploadBatchId
      )
    ) {
      return NextResponse.json(
        { error: 'A valid upload batch ID is required' },
        { status: 400 }
      );
    }

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
        { error: 'Provide between 1 and 6 valid public IDs' },
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
    const batchTag = `uploadbatch_${uploadBatchId}`;

    const results = await Promise.allSettled(
      publicIds.map(async (publicId: string) => {
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: 'image',
        });

        const tags: string[] = Array.isArray(resource.tags)
          ? resource.tags
          : [];

        // Require both tags before deleting anything.
        if (!tags.includes(artistTag) || !tags.includes(batchTag)) {
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

    const failedCount = results.length - cleanedCount;

    if (failedCount > 0) {
      console.error(
        '[POST /api/upload/cleanup] Some assets could not be cleaned up',
        results.map((result, index) => ({
          publicId: publicIds[index],
          status: result.status,
          reason:
            result.status === 'rejected'
              ? String(result.reason)
              : result.value
                ? undefined
                : 'Ownership tags did not match or Cloudinary did not delete the asset',
        })).filter((result) => result.status === 'rejected' || result.reason)
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
