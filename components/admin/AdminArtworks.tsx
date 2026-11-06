'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Image as ImageIcon,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface ArtworkArtist {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface AdminArtwork {
  _id: string;
  title: string;
  code: string;
  images: string[];
  artist: ArtworkArtist | null;
  medium: string;
  originalPrice: number;
  shippingCost: number;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isCuratorsPick: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ArtworksResponse {
  artworks: AdminArtwork[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ArtworkImage({ artwork }: { artwork: AdminArtwork }) {
  const imageUrl = artwork.images?.[0];

  if (!imageUrl) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 text-gray-400">
        <ImageIcon size={28} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={artwork.title}
      loading="lazy"
      className="aspect-[4/3] w-full bg-gray-100 object-cover"
    />
  );
}

export default function AdminArtworks() {
  const [artworks, setArtworks] = useState<AdminArtwork[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [collection, setCollection] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadArtworks() {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status,
        collection,
      });

      if (search) {
        params.set('search', search);
      }

      try {
        const response = await fetch(
          `/api/admin/artworks?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load artworks.'
          );
        }

        const result = data as ArtworksResponse;

        setArtworks(result.artworks);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === 'AbortError'
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load artworks.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadArtworks();

    return () => controller.abort();
  }, [page, status, collection, search, reloadKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-[#e63329]"
          >
            <ArrowLeft size={15} />
            Back to admin overview
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e63329]">
                <ImageIcon size={15} />
                Administration
              </div>

              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                Artwork management
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Review all marketplace listings, including unavailable artworks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {total.toLocaleString('en-IN')} artwork
                {total !== 1 ? 's' : ''}
              </span>

              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                disabled={loading}
                aria-label="Refresh artworks"
                className="inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_210px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by artwork title or code"
                maxLength={100}
                aria-label="Search artworks"
                className="w-full border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#e63329]"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by availability"
              className="w-full border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#e63329]"
            >
              <option value="all">All availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            <select
              value={collection}
              onChange={(event) => {
                setCollection(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by collection"
              className="w-full border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#e63329]"
            >
              <option value="all">All collections</option>
              <option value="featured">Featured</option>
              <option value="curators-pick">Curator&apos;s picks</option>
              <option value="trending">Trending</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <div className="flex-1">{error}</div>

            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="inline-flex items-center gap-1 font-semibold underline"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {loading && artworks.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse border border-gray-200 bg-white"
              >
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 bg-gray-100" />
                  <div className="h-3 w-1/2 bg-gray-100" />
                  <div className="h-3 w-2/3 bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <div className="border border-gray-200 bg-white px-5 py-16 text-center">
            <ImageIcon
              size={30}
              className="mx-auto mb-3 text-gray-300"
            />
            <p className="text-sm font-medium text-gray-700">
              No artworks found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artworks.map((artwork) => (
              <article
                key={artwork._id}
                className="overflow-hidden border border-gray-200 bg-white"
              >
                <div className="relative">
                  <ArtworkImage artwork={artwork} />

                  <span
                    className={`absolute left-3 top-3 px-2.5 py-1 text-[10px] font-semibold ${
                      artwork.isAvailable
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-900/80 text-white'
                    }`}
                  >
                    {artwork.isAvailable ? 'Available' : 'Unavailable'}
                  </span>

                  {artwork.images.length > 1 && (
                    <span className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                      {artwork.images.length} images
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {artwork.isFeatured && (
                      <span className="bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                        Featured
                      </span>
                    )}

                    {artwork.isCuratorsPick && (
                      <span className="bg-purple-50 px-2 py-1 text-[10px] font-medium text-purple-700">
                        Curator&apos;s pick
                      </span>
                    )}

                    {artwork.isTrending && (
                      <span className="bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">
                        Trending
                      </span>
                    )}
                  </div>

                  <h2 className="line-clamp-2 text-sm font-semibold text-gray-900">
                    {artwork.title}
                  </h2>

                  <p className="mt-1 text-[11px] text-gray-400">
                    Code: {artwork.code}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(artwork.originalPrice)}
                    </span>

                    <span className="text-xs text-gray-500">
                      {artwork.medium}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-700">
                      {artwork.artist?.name || 'Unknown artist'}
                    </p>

                    <p className="mt-1 break-all text-[11px] text-gray-400">
                      {artwork.artist?.email || 'Artist account unavailable'}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Stock: {artwork.stock}
                      </span>

                      <span className="text-gray-400">
                        {formatDate(artwork.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {total === 0
              ? 'No artworks'
              : `Showing ${(page - 1) * 20 + 1}–${Math.min(
                  page * 20,
                  total
                )} of ${total.toLocaleString('en-IN')}`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="px-2 text-xs tabular-nums text-gray-500">
              Page {page} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(Math.max(totalPages, 1), current + 1)
                )
              }
              disabled={page >= totalPages || loading || totalPages === 0}
              className="inline-flex items-center gap-1 border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
