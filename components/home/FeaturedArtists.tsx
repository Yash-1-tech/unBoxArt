'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const artists = [
  { id: '1', name: 'Dinkar Jadav', location: 'Indian, Mumbai', rating: 4.8, sales: 124, views: 1200, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { id: '2', name: 'Priya Sharma', location: 'Indian, Delhi', rating: 4.6, sales: 98, views: 1050, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { id: '3', name: 'Ravi Mehta', location: 'Indian, Pune', rating: 4.9, sales: 203, views: 2100, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
  { id: '4', name: 'Anjali Nair', location: 'Indian, Kochi', rating: 4.7, sales: 156, views: 1800, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
  { id: '5', name: 'Suresh Patel', location: 'Indian, Ahmedabad', rating: 4.5, sales: 87, views: 920, image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
  { id: '6', name: 'Maya Iyer', location: 'Indian, Chennai', rating: 4.8, sales: 142, views: 1600, image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80' },
  { id: '7', name: 'Arjun Rao', location: 'Indian, Bangalore', rating: 4.6, sales: 119, views: 1300, image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-2.5 h-2.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[10px] text-gray-400 ml-0.5">{rating}</span>
    </div>
  );
}

export default function FeaturedArtists() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
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
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="flex-shrink-0 w-[155px] group"
              >
                <div className="aspect-square overflow-hidden bg-gray-100 mb-2.5">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[12px] font-semibold text-gray-900 leading-snug">
                  {artist.name} &nbsp;|&nbsp; {artist.location}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={artist.rating} />
                  <span className="text-[10px] text-gray-400">{artist.sales} &nbsp;|&nbsp; {artist.views}</span>
                </div>
              </Link>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-[#e63329] hover:text-[#e63329] transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
