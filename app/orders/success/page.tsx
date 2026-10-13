'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ArtworkSummary {
  _id?: string;
  title?: string;
  images?: string[];
  code?: string;
  medium?: string;
  artist?: {
    name?: string;
  } | string;
}

interface OrderItem {
  _id?: string;
  artwork: ArtworkSummary | string | null;
  type: 'original' | 'digital_print';
  quantity: number;
  price: number;
}

interface OrderDetails {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt?: string;
}

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function OrderSuccessPage() {
  const [order, setOrder] =
    useState<OrderDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      const params = new URLSearchParams(
        window.location.search
      );

      const orderId = params.get('orderId');

      if (!orderId) {
        setError(
          'No order ID was provided. You can find your purchases in My Orders.'
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load order details.'
          );
        }

        if (!cancelled) {
          setOrder(data as OrderDetails);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load your order details.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto text-gray-400 animate-spin mb-4"
          />
          <p className="text-sm text-gray-500">
            Loading your order details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white max-w-md w-full p-8 text-center shadow-sm">
          <AlertCircle
            size={40}
            className="mx-auto text-amber-500 mb-4"
          />

          <h1 className="text-xl font-bold text-gray-900 mb-3">
            Order details unavailable
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            {error ||
              'Your order may still have been created successfully.'}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard?section=orders"
              className="btn-primary"
            >
              View My Orders
            </Link>

            <Link
              href="/art-gallery"
              className="btn-secondary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Confirmation heading */}
        <div className="bg-white p-8 sm:p-10 text-center shadow-sm mb-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle
              size={36}
              className="text-green-500"
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed!
          </h1>

          <p className="text-sm text-gray-500 mb-5">
            Thank you for your purchase. Your order has
            been received.
          </p>

          <p className="text-xs text-gray-500 mb-1">
            Order Number
          </p>

          <p className="text-lg font-semibold text-gray-900">
            {order.orderNumber}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              Order: {formatStatus(order.orderStatus)}
            </span>

            <span
              className={`text-xs px-3 py-1 rounded-full ${
                order.paymentStatus === 'paid'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              Payment: {formatStatus(order.paymentStatus)}
            </span>
          </div>
        </div>

        {/* Ordered items */}
        <div className="bg-white p-6 sm:p-8 shadow-sm mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-5">
            Order Details
          </h2>

          <div className="space-y-5">
            {order.items.map((item, index) => {
              const artwork =
                typeof item.artwork === 'object' &&
                item.artwork !== null
                  ? item.artwork
                  : null;

              return (
                <div
                  key={
                    item._id ||
                    `${artwork?._id || index}-${item.type}`
                  }
                  className="flex gap-4 items-center"
                >
                  <div className="w-16 h-16 bg-gray-100 flex-shrink-0 overflow-hidden">
                    {artwork?.images?.[0] ? (
                      <img
                        src={artwork.images[0]}
                        alt={artwork.title || 'Artwork'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🎨
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {artwork?.title || 'Artwork'}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {item.type === 'digital_print'
                        ? 'Digital Print'
                        : 'Original Painting'}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(
                      item.price * item.quantity
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 mt-6 pt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>
              <span>
                {formatCurrency(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Shipping
              </span>
              <span>
                {formatCurrency(order.shippingCost)}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Discount
                </span>
                <span>
                  −{formatCurrency(order.discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-100 pt-4 font-bold">
              <span>Total Paid / Due</span>
              <span className="text-xl">
                {formatCurrency(order.total)}
              </span>
            </div>

            <p className="text-xs text-gray-400 pt-1">
              Payment method: {formatStatus(order.paymentMethod)}
            </p>
          </div>
        </div>

        {/* What's next */}
        <div className="bg-white border border-gray-100 p-5 flex gap-3 mb-6">
          <Package
            size={20}
            className="text-gray-400 flex-shrink-0 mt-0.5"
          />

          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              What happens next?
            </h2>

            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              You can check your order status in My Orders.
              Shipping and tracking details will appear
              when they become available.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard?section=orders"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            View My Orders
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/art-gallery"
            className="btn-secondary flex-1 flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}