'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Artwork {
  _id: string;
  subject?: string;
  images?: string[];
}

interface Category {
  label: string;
  value: string;
  image: string;
}

const categoryDefinitions = [
  {
    label: 'Abstract',
    value: 'Abstract',
  },
  {
    label: 'Landscape',
    value: 'Landscape',
  },
  {
    label: 'Portrait',
    value: 'Portrait',
  },
  {
    label: 'Still Life',
    value: 'Still Life',
  },
  {
    label: 'Wildlife',
    value: 'Wildlife',
  },
  {
    label: 'Religious',
    value: 'Religious',
  },
];

const fallbackImages = [
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80',
  'https://images.unsplash.com/photo-1549887534-1541e9326688?w=400&q=80',
];

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>(
    categoryDefinitions.map((category, index) => ({
      ...category,
      image: fallbackImages[index],
    }))
  );

  useEffect(() => {
    const fetchCategoryImages = async () => {
      try {
        const res = await fetch('/api/artworks?limit=100');

        if (!res.ok) return;

        const data = await res.json();
        const artworks: Artwork[] = data.artworks || [];

        const updatedCategories = categoryDefinitions.map(
          (category, index) => {
            const matchingArtwork = artworks.find(
              (artwork) =>
                artwork.subject?.trim().toLowerCase() ===
                category.value.toLowerCase()
            );

            return {
              ...category,
              image:
                matchingArtwork?.images?.[0] ||
                fallbackImages[index],
            };
          }
        );

        setCategories(updatedCategories);
      } catch (error) {
        console.error(
          'Failed to load category images:',
          error
        );
      }
    };

    fetchCategoryImages();
  }, []);

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="section-header">
          <h2 className="section-title">By Categories</h2>

          <Link
            href="/art-gallery"
            className="view-all-link"
          >
            View All &rsaquo;
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={`/art-gallery?subject=${encodeURIComponent(
                category.value
              )}`}
              className="group block text-center"
            >
              <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                <img
                  src={category.image}
                  alt={category.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <p className="text-xs font-medium text-gray-700 group-hover:text-[#e63329] transition-colors">
                {category.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}