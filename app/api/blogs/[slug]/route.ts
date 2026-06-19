import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';

// GET /api/blogs/[slug]
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const blog = await Blog.findOne({ slug: params.slug, isPublished: true })
      .populate('author', 'name profileImage bio location');

    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Increment view count
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec();

    return NextResponse.json(blog);
  } catch (err) {
    console.error('[GET /api/blogs/[slug]]', err);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}
