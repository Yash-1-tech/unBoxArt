import { Suspense } from 'react';
import GalleryClient from './GalleryClient';

export default function ArtGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
          <p className="text-sm text-gray-500">
            Loading gallery...
          </p>
        </div>
      }
    >
      <GalleryClient />
    </Suspense>
  );
}
