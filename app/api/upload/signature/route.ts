
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
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
        { error: 'Only artist accounts can upload artwork' },
        { status: 403 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
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

    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
    timestamp,
    upload_preset: uploadPreset,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return NextResponse.json({
      cloudName,
      apiKey,
      signature,
      ...paramsToSign,
    });
  } catch (err: unknown) {
    console.error('[POST /api/upload/signature]', err);

    return NextResponse.json(
      { error: 'Unable to prepare secure image upload' },
      { status: 500 }
    );
  }
}
