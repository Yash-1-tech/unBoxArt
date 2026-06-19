'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import ArtworkCard from '@/components/ui/ArtworkCard';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ARTWORKS = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  title: 'Title Title Title Title Title Title',
  artistName: 'Dinkar Jadav',
  medium: i % 3 === 0 ? 'Acrylic' : i % 3 === 1 ? 'Oil' : 'Water Colour',
  dimensions: `${24 + (i % 3) * 6}"×${18 + (i % 4) * 6}"`,
  price: 20000 + i * 8000,
  image: [
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
    'https://images.unsplash.com/photo-1549887534-1541e9326688?w=600&q=80',
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&q=80',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80',
  ][i % 6],
  likes: 100 + i * 5,
  views: 300 + i * 12,
  comments: 5 + i,
  rating: 4.0 + (i % 10) / 10,
  code: `HF-${4380 + i}`,
}));

const filterOptions = {
  Price: ['Under ₹10,000', '₹10,000–₹50,000', '₹50,000–₹1,00,000', 'Above ₹1,00,000'],
  Size: ['Small (up to 12")', 'Medium (12"–24")', 'Large (24"–36")', 'Extra Large (36"+)'],
  Medium: ['Acrylic', 'Oil', 'Watercolor', 'Pencil', 'Digital', 'Mixed Media'],
  Subject: ['Abstract', 'Landscape', 'Portrait', 'Still Life', 'Wildlife', 'Religious'],
  Style: ['Modern', 'Contemporary', 'Impressionist', 'Realist', 'Expressionist'],
  Color: ['Red', 'Blue', 'Green', 'Yellow', 'Monochrome', 'Multi-color'],
};

interface ActiveFilter {
  key: string;
  value: string;
}

export default function GalleryPage() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const addFilter = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const exists = prev.find((f) => f.key === key && f.value === value);
      if (exists) return prev.filter((f) => !(f.key === key && f.value === value));
      const without = prev.filter((f) => f.key !== key);
      return [...without, { key, value }];
    });
    setOpenDropdown(null);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSortBy('newest');
  };

  const filteredArtworks = useMemo(() => {
    let result = [...ARTWORKS];
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'popular') result.sort((a, b) => b.views - a.views);
    return result;
  }, [sortBy, activeFilters]);

  const paginated = filteredArtworks.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filteredArtworks.length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <a href="/" className="hover:text-[#e63329]">Home</a>
        <span>/</span>
        <a href="/art-gallery" className="hover:text-[#e63329]">Gallery</a>
        <span>/</span>
        <span className="text-gray-600">Product Details</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-playfair font-bold text-gray-900 tracking-wide uppercase mb-4">
          Available Paintings for Sale
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-4xl">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
          been the industry's standard dummy text ever since the 1500s, when an unknown printer took a
          galley of type and scrambled it to make a type specimen book. It has survived not only five
          centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It
          was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum
          passages, and more recently with desktop publishing software like Aldus PageMaker including
          versions of Lorem Ipsum.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="sticky top-16 z-30 bg-white pb-3 pt-1 border-b border-gray-100 mb-6">
        <div className="flex items-center flex-wrap gap-2">
          {/* Filter dropdowns */}
          {Object.entries(filterOptions).map(([key, options]) => {
            const active = activeFilters.find((f) => f.key === key);
            return (
              <div key={key} className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                  className={`flex items-center gap-1.5 text-xs border px-3 py-2 pr-7 relative whitespace-nowrap transition-colors ${
                    active
                      ? 'border-[#e63329] text-[#e63329] bg-red-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                  }`}
                >
                  {active ? active.value : key}
                  <ChevronDown
                    size={12}
                    className={`absolute right-2 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`}
                  />
                </button>

                {openDropdown === key && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenDropdown(null)}
                    />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[180px] py-1">
                      {options.map((opt) => {
                        const isSelected = activeFilters.find((f) => f.key === key && f.value === opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => addFilter(key, opt)}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${
                              isSelected ? 'text-[#e63329] font-medium' : 'text-gray-700'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Sort */}
          <div className="relative ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select text-xs border border-gray-200 px-3 py-2 pr-8 bg-white appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#e63329] border border-[#e63329] px-3 py-2 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Clear All
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFilters.map((f) => (
              <span
                key={`${f.key}-${f.value}`}
                className="flex items-center gap-1 text-[11px] bg-red-50 text-[#e63329] border border-red-200 px-2.5 py-1"
              >
                {f.value}
                <button onClick={() => setActiveFilters((prev) => prev.filter((x) => !(x.key === f.key && x.value === f.value)))}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-4">
        Showing {paginated.length} of {filteredArtworks.length} artworks
      </p>

      {/* Asymmetric Masonry Grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
        {paginated.map((artwork, i) => (
          <div key={artwork.id} className="break-inside-avoid">
            <ArtworkCard
              {...artwork}
              className={i % 5 === 0 ? '[&_img]:aspect-[3/4]' : i % 5 === 2 ? '[&_img]:aspect-square' : '[&_img]:aspect-[4/5]'}
            />
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary"
          >
            Load More Artworks
          </button>
        </div>
      )}

      {!hasMore && filteredArtworks.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-12">
          You've seen all {filteredArtworks.length} artworks
        </p>
      )}

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: Math.ceil(filteredArtworks.length / PER_PAGE) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i + 1 === page ? 'bg-[#e63329]' : 'bg-gray-200 hover:bg-gray-400'
            }`}
            aria-label={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
