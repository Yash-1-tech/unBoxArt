import HeroCarousel from '@/components/home/HeroCarousel';
import FeaturedArtists from '@/components/home/FeaturedArtists';
import ArtworkSection from '@/components/home/ArtworkSection';
import YouTubeSection from '@/components/home/YouTubeSection';
import ValueProps from '@/components/home/ValueProps';
import CategorySection from '@/components/home/CategorySection';

// ─── Mock Data (replace with real DB calls) ───────────────────────────────────
const curatorsPicks = [
  { id: '1', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Acrylic On Canvas', dimensions: '36"×36"', price: 160000, image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80', likes: 123, views: 456, comments: 12, rating: 4.3 },
  { id: '2', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Acrylic On Canvas', dimensions: '36"×36"', price: 160000, image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80', likes: 120, views: 389, comments: 9, rating: 4.5 },
  { id: '3', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Acrylic On Canvas', dimensions: '36"×36"', price: 160000, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80', likes: 98, views: 321, comments: 7, rating: 4.1 },
];

const trendyArtworks = [
  { id: '4', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Acrylic On Canvas', dimensions: '36"×36"', price: 160000, image: 'https://images.unsplash.com/photo-1549887534-1541e9326688?w=600&q=80', likes: 145, views: 520, comments: 18, rating: 4.6 },
  { id: '5', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Acrylic On Canvas', dimensions: '36"×36"', price: 160000, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80', likes: 132, views: 410, comments: 14, rating: 4.4 },
  { id: '6', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Acrylic On Canvas', dimensions: '36"×36"', price: 160000, image: 'https://images.unsplash.com/photo-1577720643272-265f09367456?w=600&q=80', likes: 109, views: 387, comments: 11, rating: 4.2 },
];

const affordableArtworks = [
  { id: '7', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Watercolor', dimensions: '18"×24"', price: 25000, image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&q=80', likes: 89, views: 267, comments: 6, rating: 4.0 },
  { id: '8', title: 'Painting Title', artistName: 'Priya Sharma', medium: 'Watercolor', dimensions: '12"×16"', price: 18000, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', likes: 76, views: 234, comments: 5, rating: 3.9 },
  { id: '9', title: 'Painting Title', artistName: 'Ravi Mehta', medium: 'Pencil', dimensions: '10"×14"', price: 12000, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', likes: 65, views: 198, comments: 4, rating: 4.1 },
];

const recentlySold = [
  { id: '10', title: 'Painting Title', artistName: 'Dinkar Jadav', medium: 'Acrylic On Canvas', dimensions: '36"×36"', price: 160000, image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80', likes: 201, views: 678, comments: 23, rating: 4.8, showDeleteBadge: true },
  { id: '11', title: 'Painting Title', artistName: 'Anjali Nair', medium: 'Oil', dimensions: '24"×30"', price: 95000, image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80', likes: 178, views: 512, comments: 19, rating: 4.7, showDeleteBadge: true },
  { id: '12', title: 'Painting Title', artistName: 'Suresh Patel', medium: 'Acrylic', dimensions: '20"×20"', price: 75000, image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80', likes: 143, views: 445, comments: 15, rating: 4.5, showDeleteBadge: true },
];

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <FeaturedArtists />

      <ArtworkSection
        title="Curators' Picks"
        viewAllHref="/art-gallery?collection=curators-picks"
        artworks={curatorsPicks}
        columns={3}
      />

      <ArtworkSection
        title="Trendy"
        viewAllHref="/art-gallery?sort=trending"
        artworks={trendyArtworks}
        columns={3}
      />

      <ArtworkSection
        title="Affordable Artwork"
        viewAllHref="/art-gallery?sort=price-asc"
        artworks={affordableArtworks}
        columns={3}
      />

      <ArtworkSection
        title="Recently Sold"
        viewAllHref="/art-gallery?filter=sold"
        artworks={recentlySold}
        columns={3}
      />

      <CategorySection />
      <YouTubeSection />
      <ValueProps />
    </>
  );
}
