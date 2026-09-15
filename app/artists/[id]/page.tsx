'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Star,
  Eye,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

import ArtworkCard from '@/components/ui/ArtworkCard';
import ValueProps from '@/components/home/ValueProps';

interface Artist {
  _id: string;
  name: string;
  location?: string;
  rating?: number;
  totalSales?: number;
  profileImage?: string;
  bio?: string;
  followers?: string[];
  reviewCount?: number;
  isVerified?: boolean;
}

interface Artwork {
  _id: string;
  title: string;
  images: string[];
  medium: string;
  dimensions: {
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
  originalPrice: number;
  likes: number;
  views: number;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export default function ArtistProfilePage() {
  const params = useParams<{ id: string }>();
  const artistId = params?.id;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    if (!artistId) return;

    const fetchArtist = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/users/${artistId}`);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to fetch artist');
        }

        const data = await res.json();

        setArtist(data.user);
        setArtworks(data.artworks || []);
      } catch (err) {
        console.error('Failed to fetch artist:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load artist profile'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [artistId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-500">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Artist not found
          </h1>

          <p className="mt-2 text-gray-500">
            {error || 'We could not find this artist.'}
          </p>

          <Link
            href="/artists"
            className="inline-block mt-6 px-5 py-2.5 bg-black text-white rounded-lg"
          >
            Back to Artists
          </Link>
        </div>
      </div>
    );
  }

  const followerCount = artist.followers?.length || 0;
  const rating = artist.rating || 0;
  const sales = artist.totalSales || 0;

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>

          <ChevronRight size={15} />

          <Link href="/artists" className="hover:text-black">
            Artists
          </Link>

          <ChevronRight size={15} />

          <span className="text-gray-900">{artist.name}</span>
        </div>
      </div>

      {/* Artist Header */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Artist Image */}
          <div className="shrink-0">
            {artist.profileImage ? (
              <img
                src={artist.profileImage}
                alt={artist.name}
                className="w-40 h-40 lg:w-52 lg:h-52 rounded-full object-cover"
              />
            ) : (
              <div className="w-40 h-40 lg:w-52 lg:h-52 rounded-full bg-gray-100 flex items-center justify-center text-4xl font-semibold text-gray-400">
                {artist.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Artist Details */}
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900">
              {artist.name}
            </h1>

            {artist.location && (
              <div className="flex items-center gap-2 mt-3 text-gray-600">
                <MapPin size={18} />
                <span>{artist.location}</span>
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-6">
              <div>
                <div className="flex items-center gap-1 font-semibold text-gray-900">
                  <Star size={17} className="fill-current" />
                  {rating.toFixed(1)}
                </div>
                <p className="text-sm text-gray-500">Rating</p>
              </div>

              <div>
                <div className="font-semibold text-gray-900">
                  {sales}
                </div>
                <p className="text-sm text-gray-500">Sales</p>
              </div>

              <div>
                <div className="font-semibold text-gray-900">
                  {followerCount}
                </div>
                <p className="text-sm text-gray-500">Followers</p>
              </div>

              <div>
                <div className="font-semibold text-gray-900">
                  {artworks.length}
                </div>
                <p className="text-sm text-gray-500">Artworks</p>
              </div>
            </div>

            {/* Bio */}
            {artist.bio && (
              <div className="mt-6 max-w-3xl">
                <p
                  className={`text-gray-600 leading-7 ${
                    !showFullBio ? 'line-clamp-3' : ''
                  }`}
                >
                  {artist.bio}
                </p>

                {artist.bio.length > 180 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="mt-2 text-sm font-medium text-black underline"
                  >
                    {showFullBio ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            {['about', 'reviews', 'news'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium capitalize border-b-2 ${
                  activeTab === tab
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500'
                }`}
              >
                {tab === 'about'
                  ? 'About Artist'
                  : tab === 'reviews'
                    ? 'Reviews'
                    : 'News'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'about' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Artwork by {artist.name}
                </h2>

                <p className="text-gray-500 mt-1">
                  {artworks.length} available artwork
                  {artworks.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {artworks.length === 0 ? (
              <div className="py-16 text-center border border-gray-200 rounded-xl">
                <p className="text-gray-500">
                  This artist has no available artworks yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {artworks.map((artwork) => (
                  <ArtworkCard
                    key={artwork._id}
                    id={artwork._id}
                    title={artwork.title}
                    artistName={artist.name}
                    medium={artwork.medium}
                    dimensions={`${artwork.dimensions.width}×${artwork.dimensions.height}${artwork.dimensions.unit}`}
                    price={artwork.originalPrice}
                    image={artwork.images?.[0] || ''}
                    likes={artwork.likes}
                    views={artwork.views}
                    comments={artwork.reviewCount}
                    rating={artwork.avgRating}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Reviews
            </h2>

            <p className="mt-2 text-gray-500">
              {artist.reviewCount || 0} review
              {(artist.reviewCount || 0) === 1 ? '' : 's'}
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Star size={22} className="fill-current" />
              <span className="text-2xl font-semibold">
                {rating.toFixed(1)}
              </span>
              <span className="text-gray-500">artist rating</span>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              News
            </h2>

            <p className="mt-2 text-gray-500">
              No artist news available yet.
            </p>
          </div>
        )}
      </section>

      <ValueProps />
    </div>
  );
}