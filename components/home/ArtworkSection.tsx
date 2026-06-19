import Link from 'next/link';
import ArtworkCard from '@/components/ui/ArtworkCard';

interface Artwork {
  id: string;
  title: string;
  artistName: string;
  medium: string;
  dimensions: string;
  price: number;
  image: string;
  likes?: number;
  views?: number;
  comments?: number;
  rating?: number;
}

interface ArtworkSectionProps {
  title: string;
  viewAllHref: string;
  artworks: Artwork[];
  columns?: 3 | 4;
}

export default function ArtworkSection({
  title,
  viewAllHref,
  artworks,
  columns = 3,
}: ArtworkSectionProps) {
  const gridClass = columns === 4
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3';

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <Link href={viewAllHref} className="view-all-link">
            View All &rsaquo;
          </Link>
        </div>

        <div className={`grid ${gridClass} gap-x-5 gap-y-2`}>
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} {...artwork} />
          ))}
        </div>
      </div>
    </section>
  );
}
