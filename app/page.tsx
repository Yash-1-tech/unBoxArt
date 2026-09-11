import HeroCarousel from '@/components/home/HeroCarousel';
import FeaturedArtists from '@/components/home/FeaturedArtists';
import ArtworkSection from '@/components/home/ArtworkSection';
import YouTubeSection from '@/components/home/YouTubeSection';
import ValueProps from '@/components/home/ValueProps';
import CategorySection from '@/components/home/CategorySection';

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <FeaturedArtists />

      <ArtworkSection
        title="Curators' Picks"
        viewAllHref="/art-gallery?collection=curators-picks"
        collection="curators-picks"
        columns={3}
      />

      <ArtworkSection
        title="Trendy"
        viewAllHref="/art-gallery?sort=popular"
        collection="trending"
        sort="popular"
        columns={3}
      />

      <ArtworkSection
        title="Affordable Artwork"
        viewAllHref="/art-gallery?sort=price-asc"
        sort="price-asc"
        columns={3}
      />

      <ArtworkSection
        title="New Arrivals"
        viewAllHref="/art-gallery?sort=newest"
        sort="newest"
        columns={3}
      />

      <CategorySection />
      <YouTubeSection />
      <ValueProps />
    </>
  );
}
