'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown } from 'lucide-react';
import ValueProps from '@/components/home/ValueProps';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ARTISTS_PER_PAGE = 24;

interface Artist {
  _id: string;
  name: string;
  location?: string;
  rating?: number;
  totalSales?: number;
  profileImage?: string;
  createdAt?: string;
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [activeLetter, setActiveLetter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch('/api/users?role=artist&limit=100');

        if (!res.ok) {
          throw new Error('Failed to fetch artists');
        }

        const data = await res.json();

        setArtists(data.users || []);
      } catch (err) {
        console.error('Failed to fetch artists:', err);
        setError('Unable to load artists. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const filteredArtists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = artists.filter((artist) => {
      const matchesLetter =
        !activeLetter ||
        artist.name.toUpperCase().startsWith(activeLetter);

      const matchesSearch =
        !query ||
        artist.name.toLowerCase().includes(query);

      return matchesLetter && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'az':
          return a.name.localeCompare(b.name);

        case 'popular':
          return (b.totalSales ?? 0) - (a.totalSales ?? 0);

        case 'newest':
        default:
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
      }
    });
  }, [artists, activeLetter, searchQuery, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArtists.length / ARTISTS_PER_PAGE)
  );

  const paginatedArtists = filteredArtists.slice(
    (currentPage - 1) * ARTISTS_PER_PAGE,
    currentPage * ARTISTS_PER_PAGE
  );

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleLetterChange = (letter: string) => {
    setActiveLetter(activeLetter === letter ? '' : letter);
    setCurrentPage(1);
  };

  const handleSortChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const getLocation = (location?: string) => {
    return location || 'Location not specified';
  };

  return (
    <div>
      <div className="bg-gray-50 border-b border-gray-100 py-10 px-4">
        <div className="max-w-[1280px] mx-auto">
          <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#e63329]">
              Home
            </Link>

            <span>/</span>

            <span className="text-gray-600">Artists</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 uppercase mb-3">
            Artist Page
          </h1>

          <p className="text-xs text-gray-500 leading-relaxed max-w-4xl">
            Explore the best loved art of all time. Created by highly
            recognizable modern art maestros from across India and around
            the world.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">

        {/* A–Z Filter + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">

          <div className="flex flex-wrap gap-0 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveLetter('');
                setCurrentPage(1);
              }}
              className={`px-2 py-1 border-r border-gray-200 hover:text-[#e63329] transition-colors ${
                !activeLetter
                  ? 'text-[#e63329]'
                  : 'text-gray-500'
              }`}
            >
              All
            </button>

            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterChange(letter)}
                className={`px-1.5 py-1 border-r border-gray-200 last:border-r-0 hover:text-[#e63329] transition-colors ${
                  activeLetter === letter
                    ? 'text-[#e63329] underline'
                    : 'text-gray-500'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">

            <div className="relative">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="text-xs border border-gray-200 px-3 py-2 pr-7 appearance-none focus:outline-none focus:border-[#e63329]"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="az">A–Z</option>
              </select>

              <ChevronDown
                size={11}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
              />
            </div>

            <div className="flex items-center border border-gray-200 px-3 py-2 gap-2">
              <Search size={13} className="text-gray-400" />

              <input
                type="text"
                placeholder="Search by Name"
                value={searchQuery}
                onChange={handleSearchChange}
                className="text-xs outline-none w-32 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6 mb-12">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-square bg-gray-200 mb-2" />

                <div className="h-3 bg-gray-200 rounded mb-2" />

                <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-sm text-red-500 mb-4">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[#e63329] hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Artists */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6 mb-12">
              {paginatedArtists.map((artist) => {
                const rating = artist.rating ?? 0;

                return (
                  <Link
                    key={artist._id}
                    href={`/artists/${artist._id}`}
                    className="group text-center"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
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
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                          No image
                        </div>
                      )}
                    </div>

                    <p
                      className="text-[11px] font-semibold text-gray-900 leading-snug"
                      style={{
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {artist.name}
                      {artist.location
                        ? ` | ${artist.location}`
                        : ''}
                    </p>

                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-2 h-2 ${
                            star <= Math.round(rating)
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364 1.118l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}

                      <span className="text-[9px] text-gray-400">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Empty state */}
            {filteredArtists.length === 0 && (
              <p className="text-center text-gray-400 py-16">
                No artists found matching your search.
              </p>
            )}

            {/* Pagination */}
            {filteredArtists.length > 0 && totalPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });
                    }}
                    className={`w-7 h-7 text-xs border transition-colors ${
                      page === currentPage
                        ? 'border-[#e63329] text-[#e63329]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ValueProps />
    </div>
  );
}