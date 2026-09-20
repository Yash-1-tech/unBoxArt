'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import ArtworkCard from '@/components/ui/ArtworkCard';

interface Artwork {
  _id: string;
  title: string;
  code: string;
  medium: string;
  subject?: string;
  style?: string;
  dimensions?: {
    width: number;
    height: number;
    unit: string;
  };
  originalPrice: number;
  images: string[];
  likes: number;
  views: number;
  reviewCount: number;
  avgRating: number;
  artist?: {
    name: string;
  };
}

type FilterKey = 'Medium' | 'Subject' | 'Style';

interface ActiveFilter {
  key: FilterKey;
  value: string;
}

const filterOptions: Record<FilterKey, string[]> = {
  Medium: [
    'Acrylic',
    'Oil',
    'Watercolor',
    'Pencil',
    'Digital',
    'Mixed Media',
  ],

  Subject: [
    'Abstract',
    'Landscape',
    'Portrait',
    'Still Life',
    'Wildlife',
    'Religious',
  ],

  Style: [
    'Modern',
    'Contemporary',
    'Impressionist',
    'Realist',
    'Expressionist',
  ],
};

const parameterForFilter: Record<FilterKey, string> = {
  Medium: 'medium',
  Subject: 'subject',
  Style: 'style',
};


function normalizeValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}


function findMatchingOption(
  key: FilterKey,
  value: string
): string | null {
  const normalized = normalizeValue(value);

  return (
    filterOptions[key].find(
      (option) => normalizeValue(option) === normalized
    ) || null
  );
}


function getFiltersFromUrl(
  searchParams: URLSearchParams
): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  (Object.keys(parameterForFilter) as FilterKey[]).forEach(
    (key) => {
      const parameter = parameterForFilter[key];
      const urlValue = searchParams.get(parameter);

      if (!urlValue) {
        return;
      }

      const matchingOption = findMatchingOption(
        key,
        urlValue
      );


      filters.push({
        key,
        value: matchingOption || urlValue,
      });
    }
  );

  return filters;
}

export default function GalleryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeFilters, setActiveFilters] =
    useState<ActiveFilter[]>([]);

  const [sortBy, setSortBy] =
    useState('newest');

  const [openDropdown, setOpenDropdown] =
    useState<FilterKey | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);


  useEffect(() => {
    const filters = getFiltersFromUrl(
      searchParams
    );

    setActiveFilters(filters);

    const urlSort = searchParams.get('sort');

    if (
      urlSort === 'popular' ||
      urlSort === 'price-asc' ||
      urlSort === 'price-desc' ||
      urlSort === 'newest'
    ) {
      setSortBy(urlSort);
    } else {
      setSortBy('newest');
    }

    setOpenDropdown(null);
  }, [searchParams]);


  const fetchArtworks = useCallback(
    async (
      pageNumber: number,
      append = false,
      signal?: AbortSignal
    ) => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();

        params.set(
          'page',
          String(pageNumber)
        );

        params.set(
          'limit',
          '12'
        );

        params.set(
          'sort',
          sortBy
        );


        activeFilters.forEach((filter) => {
          const parameter =
            parameterForFilter[filter.key];

          params.set(
            parameter,
            filter.value
          );
        });

        const response = await fetch(
          `/api/artworks?${params.toString()}`,
          {
            signal,
            cache: 'no-store',
          }
        );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to load artworks'
          );
        }

        const results = Array.isArray(
          data.artworks
        )
          ? data.artworks
          : [];

        setArtworks((previous) =>
          append
            ? [...previous, ...results]
            : results
        );

        setTotal(
          Number(data.total) || 0
        );

        setHasMore(
          Boolean(data.hasMore)
        );
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Failed to fetch artworks:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load artworks'
        );
      } finally {
        setLoading(false);
      }
    },
    [sortBy, activeFilters]
  );


  useEffect(() => {
    const controller =
      new AbortController();

    setPage(1);

    fetchArtworks(
      1,
      false,
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [fetchArtworks]);


  const navigateWithFilters = (
    filters: ActiveFilter[],
    sort: string
  ) => {
    const params =
      new URLSearchParams();

    filters.forEach((filter) => {
      const parameter =
        parameterForFilter[filter.key];


      const urlValue = normalizeValue(
        filter.value
      ).replace(/\s+/g, '-');

      params.set(
        parameter,
        urlValue
      );
    });

    if (sort !== 'newest') {
      params.set(
        'sort',
        sort
      );
    }

    const query =
      params.toString();

    const url = query
      ? `/art-gallery?${query}`
      : '/art-gallery';

    router.push(url);
  };


  const handleFilterSelect = (
    key: FilterKey,
    value: string
  ) => {
    const currentlySelected =
      activeFilters.find(
        (filter) =>
          filter.key === key
      );

    let nextFilters: ActiveFilter[];


    if (
      currentlySelected?.value === value
    ) {
      nextFilters =
        activeFilters.filter(
          (filter) =>
            filter.key !== key
        );
    } else {

      nextFilters = [
        ...activeFilters.filter(
          (filter) =>
            filter.key !== key
        ),
        {
          key,
          value,
        },
      ];
    }

    setActiveFilters(
      nextFilters
    );

    setOpenDropdown(null);

    navigateWithFilters(
      nextFilters,
      sortBy
    );
  };

  const removeFilter = (
    filterToRemove: ActiveFilter
  ) => {
    const nextFilters =
      activeFilters.filter(
        (filter) =>
          !(
            filter.key ===
              filterToRemove.key &&
            filter.value ===
              filterToRemove.value
          )
      );

    setActiveFilters(
      nextFilters
    );

    navigateWithFilters(
      nextFilters,
      sortBy
    );
  };


  const clearFilters = () => {
    setActiveFilters([]);
    setSortBy('newest');
    setOpenDropdown(null);

    router.push(
      '/art-gallery'
    );
  };


  const handleSortChange = (
    value: string
  ) => {
    setSortBy(value);

    navigateWithFilters(
      activeFilters,
      value
    );
  };


  const loadMore = () => {
    if (
      loading ||
      !hasMore
    ) {
      return;
    }

    const nextPage =
      page + 1;

    setPage(nextPage);

    fetchArtworks(
      nextPage,
      true
    );
  };


  const formatDimensions = (
    artwork: Artwork
  ) => {
    if (!artwork.dimensions) {
      return 'Dimensions unavailable';
    }

    const {
      width,
      height,
      unit,
    } = artwork.dimensions;

    if (
      !width ||
      !height
    ) {
      return 'Dimensions unavailable';
    }

    return `${width}×${height}${
      unit === 'cm'
        ? 'cm'
        : 'in'
    }`;
  };

  
  const getRating = (
    artwork: Artwork
  ) => {
    if (
      !artwork.reviewCount ||
      artwork.reviewCount <= 0
    ) {
      return 0;
    }

    if (
      !artwork.avgRating ||
      artwork.avgRating <= 0
    ) {
      return 0;
    }

    return artwork.avgRating;
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link
          href="/"
          className="hover:text-[#e63329]"
        >
          Home
        </Link>

        <span>/</span>

        <span className="text-gray-600">
          Gallery
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide uppercase mb-4">
          Available Paintings for Sale
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed max-w-4xl">
          Discover original paintings and
          digital prints from independent
          artists worldwide, all with 0%
          commission. Every piece comes with
          an authenticity certificate and
          free shipping above ₹999.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="sticky top-16 z-30 bg-white pb-3 pt-1 border-b border-gray-100 mb-6">

        <div className="flex items-center flex-wrap gap-2">

          {/* Filter Dropdowns */}
          {(
            Object.entries(
              filterOptions
            ) as [
              FilterKey,
              string[]
            ][]
          ).map(
            ([key, options]) => {
              const active =
                activeFilters.find(
                  (filter) =>
                    filter.key === key
                );

              const isOpen =
                openDropdown === key;

              return (
                <div
                  key={key}
                  className="relative"
                >
                  <button
                    type="button"
                    aria-expanded={
                      isOpen
                    }
                    onClick={() =>
                      setOpenDropdown(
                        isOpen
                          ? null
                          : key
                      )
                    }
                    className={`flex items-center gap-1.5 text-xs border px-3 py-2 pr-7 relative whitespace-nowrap transition-colors ${
                      active
                        ? 'border-[#e63329] text-[#e63329] bg-red-50'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                    }`}
                  >
                    {active
                      ? active.value
                      : key}

                    <ChevronDown
                      size={12}
                      className={`absolute right-2 transition-transform ${
                        isOpen
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() =>
                          setOpenDropdown(
                            null
                          )
                        }
                      />

                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[180px] py-1">
                        {options.map(
                          (option) => {
                            const selected =
                              activeFilters.some(
                                (filter) =>
                                  filter.key ===
                                    key &&
                                  filter.value ===
                                    option
                              );

                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() =>
                                  handleFilterSelect(
                                    key,
                                    option
                                  )
                                }
                                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                                  selected
                                    ? 'bg-red-50 text-[#e63329] font-medium'
                                    : 'text-gray-700'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            }
          )}

          {/* Sort */}
          <div className="relative ml-auto">
            <select
              value={sortBy}
              onChange={(event) =>
                handleSortChange(
                  event.target.value
                )
              }
              className="filter-select"
              aria-label="Sort artworks"
            >
              <option value="newest">
                Newest First
              </option>

              <option value="popular">
                Most Popular
              </option>

              <option value="price-asc">
                Price: Low to High
              </option>

              <option value="price-desc">
                Price: High to Low
              </option>
            </select>

            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
            />
          </div>

          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-xs text-[#e63329] border border-[#e63329] px-3 py-2 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <X size={12} />
              Clear All
            </button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFilters.map(
              (filter) => (
                <span
                  key={`${filter.key}-${filter.value}`}
                  className="flex items-center gap-1 text-[11px] bg-red-50 text-[#e63329] border border-red-200 px-2.5 py-1"
                >
                  {filter.value}

                  <button
                    type="button"
                    aria-label={`Remove ${filter.value} filter`}
                    onClick={() =>
                      removeFilter(
                        filter
                      )
                    }
                    className="hover:text-red-800"
                  >
                    <X size={10} />
                  </button>
                </span>
              )
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading &&
      artworks.length === 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {Array.from({
            length: 8,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="break-inside-avoid"
              >
                <div
                  className="bg-gray-100 animate-pulse rounded-sm"
                  style={{
                    height: `${
                      200 +
                      (index % 3) *
                        60
                    }px`,
                  }}
                />

                <div className="pt-2 space-y-1">
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />

                  <div className="h-2 bg-gray-100 animate-pulse rounded w-1/2" />
                </div>
              </div>
            )
          )}
        </div>

      ) : artworks.length === 0 ? (

        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">
            No artworks found
          </p>

          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-sm text-[#e63329] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

      ) : (

        <>
          <p className="text-xs text-gray-400 mb-4">
            Showing {artworks.length} of{' '}
            {total} artworks
          </p>

          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {artworks.map(
              (artwork) => (
                <div
                  key={artwork._id}
                  className="break-inside-avoid"
                >
                  <ArtworkCard
                    id={
                      artwork._id
                    }
                    title={
                      artwork.title
                    }
                    artistName={
                      artwork.artist
                        ?.name ||
                      'Unknown Artist'
                    }
                    medium={
                      artwork.medium
                    }
                    dimensions={formatDimensions(
                      artwork
                    )}
                    price={
                      artwork.originalPrice
                    }
                    image={
                      artwork
                        .images?.[0] ||
                      ''
                    }
                    likes={
                      artwork.likes ||
                      0
                    }
                    views={
                      artwork.views ||
                      0
                    }
                    comments={
                      artwork.reviewCount ||
                      0
                    }
                    rating={getRating(
                      artwork
                    )}
                  />
                </div>
              )
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-12">
              <button
                type="button"
                onClick={
                  loadMore
                }
                disabled={loading}
                className="btn-secondary disabled:opacity-60"
              >
                {loading
                  ? 'Loading...'
                  : 'Load More Artworks'}
              </button>
            </div>
          )}

          {!hasMore &&
            total > 0 && (
              <p className="text-center text-xs text-gray-400 mt-10">
                You've seen all{' '}
                {total} artworks
              </p>
            )}
        </>
      )}
    </div>
  );
}