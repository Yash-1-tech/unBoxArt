'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import ArtworkCard from '@/components/ui/ArtworkCard';

interface Artwork {
  _id: string;
  title: string;
  code: string;
  medium: string;
  dimensions: { width: number; height: number; unit: string };
  originalPrice: number;
  images: string[];
  likes: number;
  views: number;
  reviewCount: number;
  avgRating: number;
  artist?: { name: string };
}

const filterOptions = {
  Medium: ['Acrylic', 'Oil', 'Watercolor', 'Pencil', 'Digital', 'Mixed Media'],
  Subject: ['Abstract', 'Landscape', 'Portrait', 'Still Life', 'Wildlife', 'Religious'],
  Style: ['Modern', 'Contemporary', 'Impressionist', 'Realist', 'Expressionist'],
};

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ key: string; value: string }[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchArtworks = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '12');
      params.set('sort', sortBy);
      activeFilters.forEach((f) => {
        if (f.key === 'Medium') params.set('medium', f.value);
        if (f.key === 'Subject') params.set('subject', f.value);
        if (f.key === 'Style') params.set('style', f.value);
      });

      const res = await fetch(`/api/artworks?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load artworks');

      setArtworks((prev) => (append ? [...prev, ...data.artworks] : data.artworks));
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sortBy, activeFilters]);

  useEffect(() => {
    setPage(1);
    fetchArtworks(1, false);
  }, [sortBy, activeFilters, fetchArtworks]);

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

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchArtworks(next, true);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <a href="/" className="hover:text-[#e63329]">Home</a>
        <span>/</span>
        <span className="text-gray-600">Gallery</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide uppercase mb-4">
          Available Paintings for Sale
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-4xl">
          Discover original paintings and digital prints from independent artists worldwide, all with 0% commission.
          Every piece comes with an authenticity certificate and free shipping above ₹999.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="sticky top-16 z-30 bg-white pb-3 pt-1 border-b border-gray-100 mb-6">
        <div className="flex items-center flex-wrap gap-2">
          {Object.entries(filterOptions).map(([key, options]) => {
            const active = activeFilters.find((f) => f.key === key);
            return (
              <div key={key} className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                  className={`flex items-center gap-1.5 text-xs border px-3 py-2 pr-7 relative whitespace-nowrap transition-colors ${
                    active ? 'border-[#e63329] text-[#e63329] bg-red-50' : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                  }`}
                >
                  {active ? active.value : key}
                  <ChevronDown size={12} className={`absolute right-2 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === key && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[180px] py-1">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => addFilter(key, opt)}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${
                            activeFilters.find((f) => f.key === key && f.value === opt) ? 'text-[#e63329] font-medium' : 'text-gray-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <div className="relative ml-auto">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          {activeFilters.length > 0 && (
            <button onClick={clearFilters} className="text-xs text-[#e63329] border border-[#e63329] px-3 py-2 hover:bg-red-50 transition-colors flex items-center gap-1">
              <X size={12} /> Clear All
            </button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFilters.map((f) => (
              <span key={`${f.key}-${f.value}`} className="flex items-center gap-1 text-[11px] bg-red-50 text-[#e63329] border border-red-200 px-2.5 py-1">
                {f.value}
                <button onClick={() => setActiveFilters((prev) => prev.filter((x) => !(x.key === f.key && x.value === f.value)))}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 mb-6">{error}</p>}

      {loading && artworks.length === 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="bg-gray-100 animate-pulse rounded-sm" style={{ height: `${200 + (i % 3) * 60}px` }} />
              <div className="pt-2 space-y-1">
                <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                <div className="h-2 bg-gray-100 animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">No artworks found</p>
          <button onClick={clearFilters} className="text-sm text-[#e63329] hover:underline">Clear all filters</button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">Showing {artworks.length} of {total} artworks</p>
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {artworks.map((art) => (
              <div key={art._id} className="break-inside-avoid">
                <ArtworkCard
                  id={art._id}
                  title={art.title}
                  artistName={art.artist?.name || 'Unknown Artist'}
                  medium={art.medium}
                  dimensions={`${art.dimensions?.width}"×${art.dimensions?.height}"`}
                  price={art.originalPrice}
                  image={art.images?.[0] || ''}
                  likes={art.likes}
                  views={art.views}
                  comments={art.reviewCount}
                  rating={art.avgRating || 4.0}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-12">
              <button onClick={loadMore} disabled={loading} className="btn-secondary disabled:opacity-60">
                {loading ? 'Loading...' : 'Load More Artworks'}
              </button>
            </div>
          )}

          {!hasMore && total > 0 && (
            <p className="text-center text-xs text-gray-400 mt-10">You've seen all {total} artworks</p>
          )}
        </>
      )}
    </div>
  );
}
