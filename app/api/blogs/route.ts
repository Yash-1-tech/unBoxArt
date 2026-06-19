import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';

// GET /api/blogs
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const skip = (page - 1) * limit;
    const tag = searchParams.get('tag');

    const query: Record<string, unknown> = { isPublished: true };
    if (tag) query.tags = tag;

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content')
        .lean(),
      Blog.countDocuments(query),
    ]);

    return NextResponse.json({ blogs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/blogs]', err);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

// POST /api/blogs
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Auto-generate slug from title
    if (!body.slug) {
      body.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    const blog = await Blog.create(body);
    return NextResponse.json(blog, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/blogs]', err);
    const message = err instanceof Error ? err.message : 'Failed to create blog';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
