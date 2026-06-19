import Link from 'next/link';
import ValueProps from '@/components/home/ValueProps';

const BLOGS = Array.from({ length: 9 }, (_, i) => ({
  id: String(i + 1),
  title: 'Lorem Ipsum is simply dummy text',
  excerpt: 'of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type.',
  image: [
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&q=80',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80',
  ][i % 3],
  author: 'Dinkar Jadav',
  date: '2025-01-15',
  slug: `blog-post-${i + 1}`,
}));

export default function BlogPage() {
  return (
    <div>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
        <h1 className="font-playfair text-2xl font-bold text-gray-900 mb-8 uppercase">Blog</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {BLOGS.map((blog) => (
            <Link key={blog.id} href={`/blog/${blog.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-4">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-[#e63329] transition-colors">
                {blog.title}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{blog.excerpt}</p>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
                <span>{blog.author}</span>
                <span>·</span>
                <span>{new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-1.5 mt-12">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`w-7 h-7 text-xs border transition-colors ${
                p === 1 ? 'border-[#e63329] text-[#e63329]' : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ValueProps />
    </div>
  );
}
