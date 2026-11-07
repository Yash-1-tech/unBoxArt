'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
} from 'lucide-react';

import ValueProps from '@/components/home/ValueProps';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  excerpt?: string;
  author?: {
    name?: string;
    profileImage?: string;
  } | string | null;
  createdAt: string;
}

interface BlogsResponse {
  blogs: BlogPost[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getAuthorName(author: BlogPost['author']): string {
  if (typeof author === 'string') {
    return author;
  }

  return author?.name || 'Unknown author';
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBlogs() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '9',
        });

        const response = await fetch(
          `/api/blogs?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load blog posts.'
          );
        }

        const result = data as BlogsResponse;

        setBlogs(Array.isArray(result.blogs) ? result.blogs : []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
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
            : 'Failed to load blog posts.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadBlogs();

    return () => controller.abort();
  }, [page, reloadKey]);

  return (
    <div>
      <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold uppercase text-gray-900">
            Blog
          </h1>

          <p className="text-sm text-gray-500">
            Stories, tips, and insights from the world of art.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={() =>
                setReloadKey((current) => current + 1)
              }
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        )}

        {loading && blogs.length === 0 && !error && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="mb-4 aspect-[4/3] bg-gray-200" />
                <div className="mb-3 h-4 w-3/4 bg-gray-200" />
                <div className="mb-2 h-3 w-full bg-gray-100" />
                <div className="h-3 w-1/2 bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {!error && blogs.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                href={`/blog/${encodeURIComponent(blog.slug)}`}
                className="group block"
              >
                <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-100">
                  {blog.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <FileText size={32} className="text-gray-300" />
                  )}
                </div>

                <h2 className="mb-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-[#e63329]">
                  {blog.title}
                </h2>

                <p
                  className="overflow-hidden text-xs leading-relaxed text-gray-500"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {blog.excerpt || 'Read this article from Unboxarts.'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                  <span>{getAuthorName(blog.author)}</span>

                  <span>·</span>

                  <span className="inline-flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(blog.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="border border-gray-200 bg-white px-5 py-20 text-center">
            <FileText
              size={36}
              className="mx-auto mb-4 text-gray-300"
            />

            <h2 className="text-base font-semibold text-gray-800">
              No published articles yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              We're preparing stories and insights from the world
              of art. Please check back soon.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="text-xs tabular-nums text-gray-500">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1)
                )
              }
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <ValueProps />
    </div>
  );
}
