'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown } from 'lucide-react';
import ValueProps from '@/components/home/ValueProps';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const ARTISTS = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: ['Dinkar Jadav', 'David Farrés Calvo', 'Priya Sharma', 'Ravi Mehta', 'Anjali Nair', 'Suresh Patel', 'Maya Iyer', 'Arjun Rao', 'Neha Gupta', 'Kiran Verma'][i % 10],
  location: ['Indian, Mumbai', 'Spanish, Barcelona', 'Indian, Delhi', 'Indian, Pune', 'Indian, Kochi', 'Indian, Ahmedabad', 'Indian, Chennai', 'Indian, Bangalore', 'Indian, Jaipur', 'Indian, Hyderabad'][i % 10],
  rating: (4.0 + (i % 10) * 0.1).toFixed(1),
  sales: 80 + i * 7,
  views: 500 + i * 40,
  image: `https://picsum.photos/seed/artist${i + 1}/200/200`,
}));

export default function ArtistsPage() {
  const [activeLetter, setActiveLetter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredArtists = ARTISTS.filter((artist) => {
    const matchesLetter = !activeLetter || artist.name.toUpperCase().startsWith(activeLetter);
    const matchesSearch = !searchQuery || artist.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLetter && matchesSearch;
  });

  return (
    <div>
      {/* Page Intro Banner */}
      <div className="bg-gray-50 border-b border-gray-100 py-10 px-4">
        <div className="max-w-[1280px] mx-auto">
          <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#e63329]">Home</Link>
            <span>/</span>
            <span className="text-gray-600">Artist Page</span>
          </nav>
          <p className="text-xs text-gray-500 leading-relaxed max-w-4xl">
            Explore the best loved art of all time. Limited by those highly recognizable modern art masters. Explore the best loved art of all time, created by those highly recognizable modern art maestros. Explore the best loved art of all time, created by those highly recognizable modern art maestros. Explore the best loved art of all time, created by those highly recognizable modern art maestros.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
        {/* A–Z Filter + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Alphabet */}
          <div className="flex flex-wrap gap-0 text-xs font-semibold">
            <button
              onClick={() => setActiveLetter('')}
              className={`px-2 py-1 border-r border-gray-200 hover:text-[#e63329] transition-colors ${!activeLetter ? 'text-[#e63329]' : 'text-gray-500'}`}
            >
              All
            </button>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => setActiveLetter(activeLetter === letter ? '' : letter)}
                className={`px-1.5 py-1 border-r border-gray-200 last:border-r-0 hover:text-[#e63329] transition-colors ${
                  activeLetter === letter ? 'text-[#e63329] underline' : 'text-gray-500'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Sort & Search */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-200 px-3 py-2 pr-7 appearance-none focus:outline-none focus:border-[#e63329]"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="az">A–Z</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>

            <div className="flex items-center border border-gray-200 px-3 py-2 gap-2">
              <Search size={13} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs outline-none w-32 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Artist Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6 mb-12">
          {filteredArtists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.id}`}
              className="group text-center"
            >
              <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[11px] font-semibold text-gray-900 leading-snug line-clamp-1">
                {artist.name} | {artist.location}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className={`w-2 h-2 ${s <= Math.round(Number(artist.rating)) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-[9px] text-gray-400">{artist.rating}</span>
                <span className="text-[9px] text-gray-400 ml-1">{artist.views}</span>
                <span className="text-[9px] text-gray-400">{artist.sales}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-1.5 mt-4">
          {[1, 2, 3, 4, 5].map((p) => (
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
