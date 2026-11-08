'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

interface BlogAuthor {
  name?: string;
  email?: string;
  profileImage?: string;
}

interface AdminBlog {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  excerpt?: string;
  author: BlogAuthor | string | null;
  tags?: string[];
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogsResponse {
  blogs: AdminBlog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

function getAuthorName(author: AdminBlog['author']): string {
  if (typeof author === 'string') {
    return author;
  }

  return author?.name || 'Unknown author';
}

function PublicationStatus({
  published,
}: {
  published: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        published
          ? 'bg-green-50 text-green-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

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

    async function loadBlogs() {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status,
      });

      if (search) {
        params.set('search', search);
      }

      try {
        const response = await fetch(
          `/api/admin/blogs?${params.toString()}`,
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

        setBlogs(result.blogs);
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
  }, [page, status, search, reloadKey]);

  const firstResult =
    total === 0 ? 0 : (page - 1) * 20 + 1;

  const lastResult = Math.min(page * 20, total);

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
                <FileText size={15} />
                Administration
              </div>

              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                Blog management
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Review articles, drafts, publication status, and readership.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">
                {total.toLocaleString('en-IN')} post
                {total !== 1 ? 's' : ''}
            </span>

            <Link
                href="/admin/blogs/new"
                className="inline-flex items-center gap-2 bg-[#e63329] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#c92b22]"
            >
                <Plus size={16} />
                Create Blog Post
            </Link>

            <button
                type="button"
                onClick={() =>
                setReloadKey((current) => current + 1)
                }
                disabled={loading}
                className="inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500 disabled:opacity-50"
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(240px,1fr)_220px]">
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
                placeholder="Search by title or slug"
                maxLength={100}
                aria-label="Search blog posts"
                className="w-full border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#e63329]"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by publication status"
              className="w-full border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#e63329]"
            >
              <option value="all">All posts</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
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
              onClick={() =>
                setReloadKey((current) => current + 1)
              }
              className="inline-flex items-center gap-1 font-semibold underline"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {loading && blogs.length === 0 && !error ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="border border-gray-200 bg-white px-5 py-16 text-center">
            <FileText
              size={30}
              className="mx-auto mb-3 text-gray-300"
            />

            <p className="text-sm font-medium text-gray-700">
              No blog posts found
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Try changing your search or publication filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blogs.map((blog) => (
              <article
                key={blog._id}
                className="border border-gray-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Cover image */}
                  <div className="h-36 w-full shrink-0 overflow-hidden bg-gray-100 sm:h-28 sm:w-40">
                    {blog.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={blog.coverImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <FileText size={24} />
                      </div>
                    )}
                  </div>

                  {/* Post details */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <PublicationStatus
                        published={blog.isPublished}
                      />

                      <span className="text-[11px] text-gray-400">
                        {blog.views.toLocaleString('en-IN')} views
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-gray-900">
                      {blog.title}
                    </h2>

                    <p className="mt-1 break-all text-xs text-gray-400">
                      /blog/{blog.slug}
                    </p>

                    {blog.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
                        {blog.excerpt}
                      </p>
                    )}

                    {blog.tags && blog.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {blog.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 px-2 py-1 text-[10px] text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                      <span>
                        By {getAuthorName(blog.author)}
                      </span>

                      <span>
                        Created {formatDate(blog.createdAt)}
                      </span>

                      <span>
                        Updated {formatDate(blog.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
                    <Link
                      href={`/admin/blogs/${encodeURIComponent(blog._id)}/edit`}
                      className="inline-flex items-center gap-1.5 border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-[#e63329] hover:text-[#e63329]"
                    >
                      <Pencil size={13} />
                      Edit
                    </Link>

                    {blog.isPublished && (
                      <Link
                        href={`/blog/${encodeURIComponent(blog.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-[#e63329] hover:text-[#e63329]"
                      >
                        <ExternalLink size={13} />
                        View post
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {total === 0
              ? 'No posts'
              : `Showing ${firstResult}–${lastResult} of ${total.toLocaleString('en-IN')}`}
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
              disabled={
                page >= totalPages || loading || totalPages === 0
              }
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
