'use client';

import Link from 'next/link';
import ValueProps from '@/components/home/ValueProps';

const BLOGS = Array.from({ length: 9 }, (_, i) => ({
  id: String(i + 1),
  title: ['How to Choose Your First Original Painting', 'The Story Behind Sacred Geometry in Indian Art', '0% Commission: Why We Built Unboxarts', 'Caring for Your Acrylic Painting', 'Meet the Artist: David Farrés Calvo', 'Digital Prints vs Original Paintings', 'Watercolor Techniques for Beginners', 'How to Price Your Artwork', 'Building Your Art Collection'][i],
  excerpt: 'Discover original paintings and digital prints from independent artists worldwide. Every piece comes with an authenticity certificate and our 0% commission promise.',
  image: [
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&q=80',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80',
  ][i % 3],
  author: ['Dinkar Jadav', 'Priya Sharma', 'David Farrés Calvo'][i % 3],
  date: '2025-0' + (i + 1) + '-15',
  slug: `blog-post-${i + 1}`,
}));

export default function BlogPage() {
  return (
    <div>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase">Blog</h1>
        <p className="text-sm text-gray-500 mb-8">Stories, tips, and insights from the world of art.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {BLOGS.map((blog) => (
            <Link key={blog.id} href={`/blog/${blog.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-4">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-[#e63329] transition-colors leading-snug">{blog.title}</h2>
              <p className="text-xs text-gray-500 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{blog.excerpt}</p>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
                <span>{blog.author}</span>
                <span>·</span>
                <span>{new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 mt-12">
          {[1, 2, 3].map((p) => (
            <button key={p} className={`w-7 h-7 text-xs border transition-colors ${p === 1 ? 'border-[#e63329] text-[#e63329]' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>{p}</button>
          ))}
        </div>
      </div>
      <ValueProps />
    </div>
  );
}
