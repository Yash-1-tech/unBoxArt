
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

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

// Decode one layer when loading content into the plain-text editor.
// Saving it again will escape it before storing it in MongoDB.
function unescapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };

  return value.replace(
    /&(amp|lt|gt|quot|#39);/g,
    (entity) => entities[entity] ?? entity
  );
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Load a post, including drafts, for the admin editor.
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return jsonError('Invalid blog post ID', 400);
    }

    const blog = await Blog.findById(id)
      .select(
        '_id title slug coverImage content excerpt author tags isPublished views createdAt updatedAt'
      )
      .populate('author', 'name email profileImage')
      .lean();

    if (!blog) {
      return jsonError('Blog post not found', 404);
    }

    return NextResponse.json(
      {
        blog: {
          ...blog,
          content: unescapeHtml(blog.content),
        },
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[GET /api/admin/blogs/:id]', error);

    return jsonError('Failed to fetch blog post', 500);
  }
}

// Update article details or publication status.
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return jsonError('Invalid blog post ID', 400);
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

    const updates: Record<string, unknown> = {};

    if (data.title !== undefined) {
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

      updates.title = data.title.trim();
    }

    if (data.slug !== undefined) {
      if (typeof data.slug !== 'string') {
        return jsonError('Invalid URL slug', 400);
      }

      const slug = data.slug.trim().toLowerCase();

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

      updates.slug = slug;
    }

    if (data.coverImage !== undefined) {
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

      updates.coverImage = coverImage.toString();
    }

    if (data.content !== undefined) {
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

      updates.content = escapeHtml(data.content.trim());
    }

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

      updates.excerpt = data.excerpt.trim();
    }

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

      updates.tags = [
        ...new Set(
          data.tags.map((tag: string) => tag.trim())
        ),
      ];
    }

    if (data.isPublished !== undefined) {
      if (typeof data.isPublished !== 'boolean') {
        return jsonError(
          'Publication status must be true or false',
          400
        );
      }

      updates.isPublished = data.isPublished;
    }

    if (Object.keys(updates).length === 0) {
      return jsonError('No valid changes were provided', 400);
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('author', 'name email profileImage')
      .lean();

    if (!blog) {
      return jsonError('Blog post not found', 404);
    }

    return NextResponse.json(
      {
        message: 'Blog post updated successfully',
        blog: {
          ...blog,
          content: unescapeHtml(blog.content),
        },
      },
      {
        status: 200,
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

    if (
      error instanceof mongoose.Error.ValidationError
    ) {
      return jsonError('Invalid blog post data', 400);
    }

    console.error('[PATCH /api/admin/blogs/:id]', error);

    return jsonError('Failed to update blog post', 500);
  }
}
