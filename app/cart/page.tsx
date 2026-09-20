'use client';

import Link from 'next/link';
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { useCart } from '@/lib/CartContext';

export default function CartPage() {
  const {
    items,
    count,
    loading,
    removingItemId,
    removeItem,
    subtotal,
    shipping,
    total,
  } = useCart();

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <Loader2
          size={32}
          className="mx-auto text-gray-300 animate-spin mb-5"
        />

        <p className="text-sm text-gray-500">
          Loading your cart...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <ShoppingBag
          size={64}
          className="mx-auto text-gray-200 mb-6"
        />

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Your cart is empty
        </h1>

        <p className="text-gray-500 mb-8">
          Discover original artwork from independent artists
        </p>

        <Link
          href="/art-gallery"
          className="btn-primary"
        >
          Browse Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">
      {/* Page heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Shopping Cart{' '}
        <span className="text-gray-400 font-normal text-lg">
          ({count})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-4">
          {items.map((item) => {
            const isRemoving =
              removingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`flex gap-4 border border-gray-100 p-4 transition-opacity ${
                  isRemoving
                    ? 'opacity-50'
                    : 'opacity-100'
                }`}
              >
                {/* Artwork image */}
                <Link
                  href={`/artwork/${item.artworkId}`}
                  className="w-24 h-24 bg-gray-100 flex-shrink-0 overflow-hidden block"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎨
                    </div>
                  )}
                </Link>

                {/* Artwork information */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/artwork/${item.artworkId}`}
                    className="text-sm font-semibold text-gray-900 line-clamp-1 hover:text-[#e63329] transition-colors"
                  >
                    {item.title}
                  </Link>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.artistName}
                  </p>

                  <p className="text-xs text-gray-400 capitalize mt-0.5">
                    {item.type === 'digital_print'
                      ? 'Digital Print'
                      : 'Original Painting'}
                  </p>

                  {/* Price / quantity / shipping */}
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        ₹
                        {item.price.toLocaleString(
                          'en-IN'
                        )}
                      </p>

                      {item.quantity > 1 && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Quantity: {item.quantity}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-gray-400">
                      {item.type === 'digital_print'
                        ? 'Free shipping'
                        : `+ ₹${item.shippingCost.toLocaleString(
                            'en-IN'
                          )} shipping`}
                    </p>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={isRemoving}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors self-start flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove ${item.title} from cart`}
                >
                  {isRemoving ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="border border-gray-100 p-6 self-start sticky top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-5">
            Order Summary
          </h2>

          <div className="space-y-3 mb-5">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal ({count}{' '}
                {count === 1 ? 'item' : 'items'})
              </span>

              <span>
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Shipping
              </span>

              <span>
                ₹{shipping.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Total */}
            <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-3">
              <span>Total</span>

              <span className="text-lg">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Checkout */}
          <Link
            href="/checkout"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
          >
            Proceed to Checkout
            <ArrowRight size={16} />
          </Link>

          {/* Continue shopping */}
          <Link
            href="/art-gallery"
            className="block text-center text-xs text-gray-400 hover:text-[#e63329] mt-4 transition-colors"
          >
            Continue Shopping
          </Link>

          {/* Trust badges */}
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
            {[
              '🔒 SSL Secured Checkout',
              '🎨 Authenticity Certificate included',
              '↩️ 7-day return policy',
            ].map((badge) => (
              <p
                key={badge}
                className="text-xs text-gray-400"
              >
                {badge}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}