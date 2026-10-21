import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';

export async function GET(_req: NextRequest,{ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();
    const blog = await Blog.findOne({ slug: (await params).slug, isPublished: true })
      .populate('author', 'name profileImage bio location');
    if (!blog) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec();
    return NextResponse.json(blog);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}
