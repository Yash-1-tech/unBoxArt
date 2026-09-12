'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Artist {
  _id: string;
  name: string;
  location?: string;
  rating?: number;
  profileImage?: string;
}

export default function FeaturedArtists() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/users?role=artist&limit=7');

        if (!response.ok) {
          throw new Error('Failed to fetch artists');
        }

        const data = await response.json();

        setArtists(data.users || []);
      } catch (err) {
        console.error('Error fetching featured artists:', err);
        setError('Unable to load artists');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">

        <div className="section-header">
          <h2 className="section-title">Featured Artist</h2>

          <Link href="/artists" className="view-all-link">
            View All Artist &rsaquo;
          </Link>
        </div>

        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <div
                key={item}
                className="flex-shrink-0 w-[155px] animate-pulse"
              >
                <div className="aspect-square bg-gray-200 mb-2.5" />

                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />

                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-8 text-center text-sm text-gray-500">
            {error}
          </div>
        )}

        {!loading && !error && artists.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No artists found.
          </div>
        )}

        {!loading && !error && artists.length > 0 && (
          <div className="relative">

            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-[#e63329] hover:text-[#e63329] transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {artists.map((artist) => {
                const rating = artist.rating ?? 0;

                return (
                  <Link
                    key={artist._id}
                    href={`/artists/${artist._id}`}
                    className="flex-shrink-0 w-[155px] group"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100 mb-2.5">
                      {artist.profileImage ? (
                        <img
                          src={artist.profileImage}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                    </div>

                    <p className="text-[12px] font-semibold text-gray-900 leading-snug">
                      {artist.name}
                      {artist.location && ` | ${artist.location}`}
                    </p>

                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-2.5 h-2.5 ${
                            star <= Math.round(rating)
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}

                      <span className="text-[10px] text-gray-400 ml-0.5">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-[#e63329] hover:text-[#e63329] transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>

          </div>
        )}
      </div>
    </section>
  );
}
