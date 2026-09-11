'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, ChevronLeft, Eye, Calendar, User } from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  content: string;
  excerpt?: string;
  author: {
    name: string;
    profileImage?: string;
    bio?: string;
  };
  tags?: string[];
  views: number;
  createdAt: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blogs/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBlog(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <p className="text-gray-500 mb-4">{error || 'Blog post not found'}</p>
        <Link href="/blog" className="text-[#e63329] text-sm hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 lg:px-8 py-10">
      {/* Back */}
      <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#e63329] transition-colors mb-8">
        <ChevronLeft size={16} /> Back to Blog
      </Link>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-[#e63329] bg-red-50 px-2.5 py-1">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-5">
        {blog.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-8 pb-8 border-b border-gray-100">
        <span className="flex items-center gap-1.5">
          <User size={12} />
          {blog.author?.name}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={12} />
          {new Date(blog.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={12} />
          {blog.views} views
        </span>
      </div>

      {/* Cover Image */}
      {blog.coverImage && (
        <div className="aspect-[16/9] overflow-hidden bg-gray-100 mb-8">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
        style={{ fontSize: '15px', lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Author card */}
      {blog.author && (
        <div className="mt-12 pt-8 border-t border-gray-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e63329] flex items-center justify-center text-white font-semibold flex-shrink-0">
            {blog.author.profileImage ? (
              <img src={blog.author.profileImage} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              blog.author.name[0]
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Written by {blog.author.name}</p>
            {blog.author.bio && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{blog.author.bio}</p>
            )}
          </div>
        </div>
      )}

      {/* Back to blog */}
      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
        <Link href="/blog" className="btn-secondary">
          ← Back to Blog
        </Link>
      </div>
    </article>
  );
}
