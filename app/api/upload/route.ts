import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

const MAX_FILES = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = 62 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);


function matchesImageSignature(
  bytes: Uint8Array,
  mimeType: string
): boolean {
  if (mimeType === 'image/jpeg') {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === 'image/webp') {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

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
        { error: 'Only artist accounts can upload artwork' },
        { status: 403 }
      );
    }

    const contentLength = req.headers.get('content-length');

    if (contentLength !== null) {
      const requestSize = Number(contentLength);

      if (
        !Number.isSafeInteger(requestSize) ||
        requestSize < 0 ||
        requestSize > MAX_REQUEST_SIZE
      ) {
        return NextResponse.json(
          { error: 'Upload request exceeds the 62MB limit' },
          { status: 413 }
        );
      }
    }

    const formData = await req.formData();
    const entries = formData.getAll('files');

    if (!entries.every((entry): entry is File => entry instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid file upload' },
        { status: 400 }
      );
    }

const files = entries;

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `You can upload at most ${MAX_FILES} images at a time` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'Invalid file upload' },
          { status: 400 }
        );
      }

      const header = new Uint8Array(
        await file.slice(0, 12).arrayBuffer()
      );

      if (!matchesImageSignature(header, file.type)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" does not contain a valid ${file.type} signature`,
          },
          { status: 400 }
        );
      }

      if (file.size === 0) {
        return NextResponse.json(
          { error: `File "${file.name}" is empty` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" must be JPEG, PNG, or WebP` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 10MB limit` },
          { status: 400 }
        );
      }
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


    const uploadResults = await Promise.allSettled(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        return new Promise<{ url: string; publicId: string }>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: 'unboxarts/artworks',
                  resource_type: 'image',
                  transformation: [
                    { quality: 'auto', fetch_format: 'auto' },
                    { width: 1600, height: 1600, crop: 'limit' },
                  ],
                },
                (error, result) => {
                  if (error || !result) {
                    reject(error || new Error('Upload failed'));
                  } else {
                    resolve({
                      url: result.secure_url,
                      publicId: result.public_id,
                    });
                  }
                }
              )
              .end(buffer);
          }
        );
      })
    );

    const successfulUploads = uploadResults.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : []
    );

    const hasFailures = uploadResults.some(
      (result) => result.status === 'rejected'
    );

    if (hasFailures) {
      for (const result of uploadResults) {
        if (result.status === 'rejected') {
          console.error('[Cloudinary upload failed]', result.reason);
        }
      }

      // Remove images that succeeded so the failed batch leaves
      // as few unused Cloudinary assets as possible.
      const cleanupResults = await Promise.allSettled(
        successfulUploads.map((upload) =>
          cloudinary.uploader.destroy(upload.publicId, {
            resource_type: 'image',
          })
        )
      );

      cleanupResults.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('[Cloudinary cleanup failed]', result.reason);
        }
      });

      return NextResponse.json(
        {
          error:
            'One or more images failed to upload. Please try uploading them again.',
        },
        { status: 502 }
      );
    }

    const urls = successfulUploads.map((upload) => upload.url);

    return NextResponse.json({ urls });

  } catch (err: unknown) {
    console.error('[POST /api/upload]', err);
    const message =
      err instanceof Error ? err.message : 'Upload failed';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
