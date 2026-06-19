'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Eye, MessageSquare, ChevronRight } from 'lucide-react';
import ArtworkCard from '@/components/ui/ArtworkCard';
import ValueProps from '@/components/home/ValueProps';

const ARTIST = {
  id: 'a1',
  name: 'DAVID FARRÉS CALVO',
  location: 'Badalona (Barcelona), Catalonia, Spain',
  rating: 4.8,
  sales: 63,
  views: 1234,
  followers: 892,
  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
  bio: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets.`,
};

const ARTWORKS = Array.from({ length: 16 }, (_, i) => ({
  id: String(i + 200),
  title: 'Title Title Title Title Title Title',
  artistName: 'David Farrés Calvo',
  medium: i % 2 === 0 ? 'Water Colour' : 'Acrylic',
  dimensions: `${24 + (i % 3) * 6}"×${18 + (i % 4) * 6}"`,
  price: 40000 + i * 12000,
  image: [
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
    'https://images.unsplash.com/photo-1549887534-1541e9326688?w=600&q=80',
  ][i % 4],
  likes: 80 + i * 9,
  views: 200 + i * 25,
  comments: 5 + i,
  rating: 4.0 + (i % 10) / 10,
  code: `HF-${4380 + i}`,
}));

export default function ArtistProfilePage({ params }: { params: { id: string } }) {
  const [showFullBio, setShowFullBio] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  return (
    <div>
      {/* Profile Header */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#e63329]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/artists" className="hover:text-[#e63329]">Artist</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600">{ARTIST.name}</span>
        </nav>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-100 mb-8">
          {['About Artist', 'Reviews', 'News'].map((tab) => {
            const key = tab.toLowerCase().replace(' ', '-');
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(key)}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                  activeTab === key ? 'border-[#e63329] text-[#e63329]' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Profile Info Row */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 overflow-hidden bg-gray-100">
              <img src={ARTIST.image} alt={ARTIST.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <h1 className="font-playfair text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide">
                {ARTIST.name}
              </h1>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.round(ARTIST.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
                <span className="text-xs text-gray-500">{ARTIST.rating}</span>
                <span className="text-xs text-gray-400">{ARTIST.sales}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><Eye size={11} />{ARTIST.views}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><MessageSquare size={11} />{ARTIST.followers}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <MapPin size={12} className="text-gray-400" />
              <span>Dinkar Jadav | Indian, Mumbai</span>
            </div>

            <p className={`text-xs text-gray-500 leading-relaxed max-w-3xl ${!showFullBio ? 'line-clamp-3' : ''}`}>
              {ARTIST.bio}
            </p>
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              className="text-xs text-[#e63329] mt-1 hover:underline"
            >
              {showFullBio ? 'Show Less' : 'Read More >'}
            </button>
          </div>
        </div>
      </div>

      {/* Artwork Masonry Grid */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-12">
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {ARTWORKS.map((artwork, i) => (
            <div key={artwork.id} className="break-inside-avoid">
              <ArtworkCard {...artwork} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-1.5 mt-10">
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
