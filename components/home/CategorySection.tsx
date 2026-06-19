import Link from 'next/link';

const categories = [
  { label: 'Abstract', href: '/art-gallery?style=abstract', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80' },
  { label: 'Religion', href: '/art-gallery?subject=religion', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80' },
  { label: 'City Scape', href: '/art-gallery?subject=cityscape', image: 'https://images.unsplash.com/photo-1549887534-1541e9326688?w=400&q=80' },
  { label: 'Landscape', href: '/art-gallery?subject=landscape', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
  { label: 'Lady Figure', href: '/art-gallery?subject=figure', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80' },
  { label: 'Portrait', href: '/art-gallery?subject=portrait', image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&q=80' },
];

export default function CategorySection() {
  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="section-header">
          <h2 className="section-title">By Categories</h2>
          <Link href="/art-gallery" className="view-all-link">
            View All &rsaquo;
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group block text-center"
            >
              <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs font-medium text-gray-700 group-hover:text-[#e63329] transition-colors">
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
