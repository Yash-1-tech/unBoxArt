
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
  MapPin,
  CreditCard,
  ImageIcon,
} from 'lucide-react';

interface OrderBuyer {
  _id: string;
  name: string;
  email: string;
}

interface OrderArtist {
  _id: string;
  name: string;
}

interface OrderArtwork {
  _id: string;
  title: string;
  images: string[];
  code: string;
  medium: string;
  artist?: OrderArtist | null;
}

interface OrderItem {
  artwork: OrderArtwork | string | null;
  type: 'original' | 'digital_print';
  printMedium?: string;
  printSize?: string;
  quantity: number;
  price: number;
}

interface AdminOrder {
  _id: string;
  orderNumber: string;
  buyer: OrderBuyer | string | null;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  refundStatus?: string;
  orderStatus: string;
  trackingNumber?: string;
  shippingAddress?: {
    city?: string;
    state?: string;
    country?: string;
  };
  createdAt: string;
}

interface OrdersResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  placed: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-purple-50 text-purple-700',
  shipped: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getBuyerName(buyer: AdminOrder['buyer']): string {
  if (buyer && typeof buyer === 'object') {
    return buyer.name || 'Unknown buyer';
  }

  return 'Buyer account unavailable';
}

function getBuyerEmail(buyer: AdminOrder['buyer']): string {
  if (buyer && typeof buyer === 'object') {
    return buyer.email || '—';
  }

  return '—';
}

function getArtworkTitle(artwork: OrderItem['artwork']): string {
  if (artwork && typeof artwork === 'object') {
    return artwork.title || 'Untitled artwork';
  }

  return artwork ? 'Artwork record unavailable' : 'Deleted artwork';
}

function getArtworkCode(artwork: OrderItem['artwork']): string {
  if (artwork && typeof artwork === 'object') {
    return artwork.code || '—';
  }

  return '—';
}

function getArtworkImage(artwork: OrderItem['artwork']): string | null {
  if (
    artwork &&
    typeof artwork === 'object' &&
    Array.isArray(artwork.images)
  ) {
    return artwork.images[0] || null;
  }

  return null;
}

function OrderStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
        ORDER_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
}

function PaymentStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
        PAYMENT_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Debounce order-number search.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Fetch orders whenever filters or pagination change.
  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        orderStatus,
        paymentStatus,
      });

      if (search) {
        params.set('search', search);
      }

      try {
        const response = await fetch(
          `/api/admin/orders?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load orders.'
          );
        }

        const result = data as OrdersResponse;

        setOrders(result.orders);
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
            : 'Failed to load orders.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => controller.abort();
  }, [page, orderStatus, paymentStatus, search, reloadKey]);

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
                <ShoppingBag size={15} />
                Administration
              </div>

              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                Order management
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Review orders, buyers, payments, and fulfilment.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {total.toLocaleString('en-IN')} order
                {total !== 1 ? 's' : ''}
              </span>

              <button
                type="button"
                onClick={() =>
                  setReloadKey((current) => current + 1)
                }
                disabled={loading}
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
                placeholder="Search by order number"
                maxLength={100}
                aria-label="Search orders by order number"
                className="w-full border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#e63329]"
              />
            </div>

            <select
              value={orderStatus}
              onChange={(event) => {
                setOrderStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by order status"
              className="w-full border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#e63329]"
            >
              <option value="all">All order statuses</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by payment status"
              className="w-full border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#e63329]"
            >
              <option value="all">All payment statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
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

        {/* Loading */}
        {loading && orders.length === 0 && !error ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-gray-200 bg-white px-5 py-16 text-center">
            <ShoppingBag
              size={30}
              className="mx-auto mb-3 text-gray-300"
            />
            <p className="text-sm font-medium text-gray-700">
              No orders found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order._id}
                className="overflow-hidden border border-gray-200 bg-white"
              >
                {/* Order header */}
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatus status={order.orderStatus} />
                    <PaymentStatus status={order.paymentStatus} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                  {/* Buyer */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Buyer
                    </p>

                    <p className="text-sm font-semibold text-gray-800">
                      {getBuyerName(order.buyer)}
                    </p>

                    <p className="mt-1 break-all text-xs text-gray-500">
                      {getBuyerEmail(order.buyer)}
                    </p>
                  </div>

                  {/* Location */}
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <MapPin size={12} />
                      Delivery location
                    </p>

                    <p className="text-sm text-gray-700">
                      {[
                        order.shippingAddress?.city,
                        order.shippingAddress?.state,
                      ]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {order.shippingAddress?.country || ''}
                    </p>
                  </div>

                  {/* Payment */}
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <CreditCard size={12} />
                      Payment
                    </p>

                    <p className="text-sm font-medium capitalize text-gray-800">
                      {order.paymentMethod.replace('_', ' ')}
                    </p>

                    {order.refundStatus && (
                      <p className="mt-1 text-xs text-gray-500">
                        Refund: <span className="capitalize">{order.refundStatus}</span>
                      </p>
                    )}
                  </div>

                  {/* Total */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Order total
                    </p>

                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {order.items.length} item
                      {order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Order items */}
                <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
                  <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <Package size={13} />
                    Order items
                  </p>

                  <div className="space-y-3">
                    {order.items.map((item, index) => {
                      const imageUrl = getArtworkImage(item.artwork);

                      return (
                        <div
                          key={`${order._id}-${index}`}
                          className="flex items-center gap-3"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden bg-gray-100">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imageUrl}
                                alt={getArtworkTitle(item.artwork)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ImageIcon size={18} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {getArtworkTitle(item.artwork)}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              {getArtworkCode(item.artwork)}
                              {' · '}
                              {item.type.replace('_', ' ')}
                              {' · '}
                              Qty {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-medium text-gray-800">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Subtotal: {formatCurrency(order.subtotal)}</p>
                    <p>Shipping: {formatCurrency(order.shippingCost)}</p>
                    {order.discount > 0 && (
                      <p>Discount: −{formatCurrency(order.discount)}</p>
                    )}
                    {order.trackingNumber && (
                      <p>
                        Tracking: <span className="font-medium text-gray-700">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Total paid / due
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-5 flex flex-col gap-3 border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {total === 0
              ? 'No orders'
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
