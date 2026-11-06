'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Users,
  UserRound,
  Palette,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface OverviewStats {
  totalUsers: number;
  buyers: number;
  artists: number;
  admins: number;
  totalArtworks: number;
  availableArtworks: number;
  unavailableArtworks: number;
  totalOrders: number;
  newOrders: number;
  inProgressOrders: number;
  paidOrderValue: number;
}

interface OverviewResponse {
  stats: OverviewStats;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {detail}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-gray-50 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview({
  adminName,
}: {
  adminName: string;
}) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/overview', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load admin overview.'
        );
      }

      const result = data as OverviewResponse;

      if (!result.stats) {
        throw new Error('The overview response was invalid.');
      }

      setStats(result.stats);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load admin overview.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const statCards = stats
    ? [
        {
          label: 'Total users',
          value: formatNumber(stats.totalUsers),
          detail: `${formatNumber(stats.admins)} admin accounts`,
          icon: <Users size={20} />,
        },
        {
          label: 'Buyers',
          value: formatNumber(stats.buyers),
          detail: 'Registered buyer accounts',
          icon: <UserRound size={20} />,
        },
        {
          label: 'Artists',
          value: formatNumber(stats.artists),
          detail: 'Artist accounts',
          icon: <Palette size={20} />,
        },
        {
          label: 'Total artworks',
          value: formatNumber(stats.totalArtworks),
          detail: `${formatNumber(stats.availableArtworks)} currently available`,
          icon: <ImageIcon size={20} />,
        },
        {
          label: 'Total orders',
          value: formatNumber(stats.totalOrders),
          detail: 'All recorded orders',
          icon: <ShoppingBag size={20} />,
        },
        {
          label: 'Paid order value',
          value: formatCurrency(stats.paidOrderValue),
          detail: 'Sum of orders marked paid',
          icon: <Activity size={20} />,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e63329]">
              <ShieldCheck size={15} />
              Administration
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Admin overview
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Welcome back, {adminName}. Here is the current platform snapshot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/artworks"
              className="inline-flex items-center justify-center gap-2 bg-[#e63329] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#c92b22]"
            >
              <ImageIcon size={16} />
              Manage Artworks
            </Link>

            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#e63329] hover:text-[#e63329]"
            >
              <Users size={16} />
              Manage Users
            </Link>

            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#e63329] hover:text-[#e63329]"
            >
              <ShoppingBag size={16} />
              Manage Orders
            </Link>

            <button
              type="button"
              onClick={() => void loadOverview()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Could not load overview</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadOverview()}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading && !stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse border border-gray-200 bg-white"
              />
            ))}
          </div>
        )}

        {stats && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {statCards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.detail}
                  icon={card.icon}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-gray-700" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Order activity
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Clock3 size={17} className="text-amber-600" />
                      <span className="text-sm text-gray-600">
                        New orders
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(stats.newOrders)}
                    </span>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Activity size={17} className="text-blue-600" />
                      <span className="text-sm text-gray-600">
                        In progress
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(stats.inProgressOrders)}
                    </span>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={17} className="text-green-600" />
                      <span className="text-sm text-gray-600">
                        Available artworks
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(stats.availableArtworks)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <ImageIcon size={18} className="text-gray-700" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Marketplace inventory
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600">
                      Total artworks
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(stats.totalArtworks)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden bg-gray-100">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${
                          stats.totalArtworks > 0
                            ? (stats.availableArtworks / stats.totalArtworks) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600">
                      Available
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      {formatNumber(stats.availableArtworks)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600">
                      Unavailable
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatNumber(stats.unavailableArtworks)}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        <div className="mt-8 flex flex-col gap-2 border-t border-gray-200 pt-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Unboxarts administration</span>

          <span>
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString('en-IN')}`
              : 'Waiting for overview data'}
          </span>
        </div>
      </div>
    </div>
  );
}