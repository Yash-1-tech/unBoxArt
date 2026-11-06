'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'artist' | 'admin';
  profileImage?: string;
  isVerified: boolean;
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  location?: string;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROLE_STYLES: Record<string, string> = {
  buyer: 'bg-blue-50 text-blue-700',
  artist: 'bg-purple-50 text-purple-700',
  admin: 'bg-red-50 text-red-700',
};

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

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [verification, setVerification] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Avoid a request for every keystroke.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Load the current page whenever a filter changes.
  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        role,
        verification,
      });

      if (search) {
        params.set('search', search);
      }

      try {
        const response = await fetch(
          `/api/admin/users?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load user accounts.'
          );
        }

        const result = data as UsersResponse;

        setUsers(result.users);
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
            : 'Failed to load user accounts.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => controller.abort();
  }, [page, role, verification, search,reloadKey]);

  const changeRole = (value: string) => {
    setRole(value);
    setPage(1);
  };

  const changeVerification = (value: string) => {
    setVerification(value);
    setPage(1);
  };

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
                <Users size={15} />
                Administration
              </div>

              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                User management
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Search and review buyer, artist, and admin accounts.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              {total.toLocaleString('en-IN')} account
              {total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_190px]">
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
                placeholder="Search by name or email"
                maxLength={100}
                aria-label="Search users by name or email"
                className="w-full border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#e63329]"
              />
            </div>

            <select
              value={role}
              onChange={(event) => changeRole(event.target.value)}
              aria-label="Filter by account role"
              className="w-full border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#e63329]"
            >
              <option value="all">All roles</option>
              <option value="buyer">Buyers</option>
              <option value="artist">Artists</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={verification}
              onChange={(event) =>
                changeVerification(event.target.value)
              }
              aria-label="Filter by verification status"
              className="w-full border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#e63329]"
            >
              <option value="all">All verification statuses</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Error */}
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

        {/* Desktop table */}
        <div className="hidden overflow-hidden border border-gray-200 bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Account
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Verification
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Membership
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Location
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-sm text-gray-400"
                    >
                      Loading accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-sm text-gray-500"
                    >
                      No accounts match these filters.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {user.profileImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={user.profileImage}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials(user.name || '?')
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="max-w-[220px] truncate text-xs text-gray-500">
                              {user.email}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-400">
                              ID: {user._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-[11px] font-semibold capitalize ${ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-medium ${
                            user.isVerified
                              ? 'text-green-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm capitalize text-gray-600">
                        {user.membershipTier}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {user.location || '—'}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {loading && users.length === 0 ? (
            <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              Loading accounts...
            </div>
          ) : users.length === 0 ? (
            <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No accounts match these filters.
            </div>
          ) : (
            users.map((user) => (
              <article
                key={user._id}
                className="border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                    {user.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profileImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(user.name || '?')
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user.name}
                    </p>
                    <p className="break-all text-xs text-gray-500">
                      {user.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`px-2 py-1 text-[10px] font-semibold capitalize ${ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {user.role}
                      </span>

                      <span
                        className={`px-2 py-1 text-[10px] font-medium ${
                          user.isVerified
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
                  <div>
                    <p className="text-gray-400">Membership</p>
                    <p className="mt-1 capitalize text-gray-700">
                      {user.membershipTier}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Location</p>
                    <p className="mt-1 text-gray-700">
                      {user.location || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Joined</p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Account ID</p>
                    <p className="mt-1 break-all text-gray-700">
                      {user._id}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-5 flex flex-col gap-3 border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {total === 0
              ? 'No accounts'
              : `Showing ${(page - 1) * 20 + 1}–${Math.min(
                  page * 20,
                  total
                )} of ${total.toLocaleString('en-IN')}`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
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