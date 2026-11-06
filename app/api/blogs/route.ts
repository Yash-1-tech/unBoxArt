import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAdminUser } from '@/lib/adminAuth';
import Blog from '@/models/Blog';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: noStoreHeaders,
    }
  );
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function createSlug(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 160)
    .replace(/-+$/, '');
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '9');
    const tag = (searchParams.get('tag') ?? '').trim();

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 30
    ) {
      return jsonError('Invalid pagination parameters', 400);
    }

    if (tag.length > 50) {
      return jsonError('Tag filter is too long', 400);
    }

    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      isPublished: true,
    };

    if (tag) {
      query.tags = tag;
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name profileImage')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content')
        .lean(),

      Blog.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        blogs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[GET /api/blogs]', error);

    return jsonError('Failed to fetch blogs', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON request body', 400);
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return jsonError('Invalid blog data', 400);
    }

    const data = body as Record<string, unknown>;

    const allowedFields = [
      'title',
      'slug',
      'coverImage',
      'content',
      'excerpt',
      'tags',
      'isPublished',
    ];

    if (
      Object.keys(data).some(
        (key) => !allowedFields.includes(key)
      )
    ) {
      return jsonError('Unsupported blog fields provided', 400);
    }

    if (
      typeof data.title !== 'string' ||
      !data.title.trim() ||
      data.title.trim().length > 150
    ) {
      return jsonError(
        'Title is required and must not exceed 150 characters',
        400
      );
    }

    if (
      typeof data.coverImage !== 'string' ||
      data.coverImage.trim().length > 2048
    ) {
      return jsonError('A valid cover image URL is required', 400);
    }

    let coverImage: URL;

    try {
      coverImage = new URL(data.coverImage.trim());
    } catch {
      return jsonError('Invalid cover image URL', 400);
    }

    if (coverImage.protocol !== 'https:') {
      return jsonError(
        'Cover image must use a secure HTTPS URL',
        400
      );
    }

    if (
      typeof data.content !== 'string' ||
      !data.content.trim() ||
      data.content.length > 50000
    ) {
      return jsonError(
        'Content is required and must not exceed 50000 characters',
        400
      );
    }

    let slug =
      typeof data.slug === 'string' && data.slug.trim()
        ? data.slug.trim().toLowerCase()
        : createSlug(data.title.trim());

    if (
      !slug ||
      slug.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return jsonError(
        'Provide a valid URL slug using lowercase letters, numbers, and hyphens',
        400
      );
    }

    let excerpt: string | undefined;

    if (data.excerpt !== undefined) {
      if (
        typeof data.excerpt !== 'string' ||
        data.excerpt.trim().length > 300
      ) {
        return jsonError(
          'Excerpt must not exceed 300 characters',
          400
        );
      }

      excerpt = data.excerpt.trim() || undefined;
    }

    let tags: string[] = [];

    if (data.tags !== undefined) {
      if (
        !Array.isArray(data.tags) ||
        data.tags.length > 30 ||
        !data.tags.every(
          (tag) =>
            typeof tag === 'string' &&
            tag.trim().length > 0 &&
            tag.trim().length <= 50
        )
      ) {
        return jsonError(
          'Tags must be an array of up to 30 strings, each no longer than 50 characters',
          400
        );
      }

      tags = [
        ...new Set(
          data.tags.map((tag: string) => tag.trim())
        ),
      ];
    }

    let isPublished = false;

    if (data.isPublished !== undefined) {
      if (typeof data.isPublished !== 'boolean') {
        return jsonError(
          'Publication status must be true or false',
          400
        );
      }

      isPublished = data.isPublished;
    }

    await connectDB();

    const blog = await Blog.create({
      title: data.title.trim(),
      slug,
      coverImage: coverImage.toString(),
      content: escapeHtml(data.content.trim()),
      excerpt,
      tags,
      isPublished,
      author: admin.id,
    });

    await blog.populate('author', 'name profileImage');

    return NextResponse.json(
      {
        message: 'Blog post created successfully',
        blog,
      },
      {
        status: 201,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return jsonError(
        'A blog post with this slug already exists',
        409
      );
    }

    console.error('[POST /api/blogs]', error);

    return jsonError('Failed to create blog post', 500);
  }
}
