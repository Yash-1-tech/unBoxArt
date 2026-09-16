'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ArtworkCard from '@/components/ui/ArtworkCard';

interface Artwork {
  _id: string;
  title: string;
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

interface ArtworkSectionProps {
  title: string;
  viewAllHref: string;
  collection?: string;
  sort?: string;
  columns?: 3 | 4;
}

export default function ArtworkSection({
  title, viewAllHref, collection, sort = 'newest', columns = 3,
}: ArtworkSectionProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('limit', '3');
    params.set('sort', sort);
    if (collection) params.set('collection', collection);

    fetch(`/api/artworks?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setArtworks(data.artworks || []))
      .catch(() => setArtworks([]))
      .finally(() => setLoading(false));
  }, [collection, sort]);

  const gridClass = columns === 4
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3';

  if (!loading && artworks.length === 0) return null;

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <Link href={viewAllHref} className="view-all-link">View All &rsaquo;</Link>
        </div>

        {loading ? (
          <div className={`grid ${gridClass} gap-x-5 gap-y-2`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-x-5 gap-y-2`}>
            {artworks.map((art) => (
              <ArtworkCard
                key={art._id}
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
                rating={art.avgRating || 0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
