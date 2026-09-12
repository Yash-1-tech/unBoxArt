'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Loader2, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useRouter } from 'next/navigation';

interface WishlistArtwork {
  _id: string;
  title: string;
  images: string[];
  originalPrice: number;
  digitalPrintPrice?: number;
  medium: string;
  dimensions: { width: number; height: number; unit: string };
  artist?: { name: string };
  shippingCost: number;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { addItem, isInCart } = useCart();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin?from=/wishlist');
      return;
    }
    fetch(`/api/users/${user.id}/wishlist`)
      .then((res) => res.json())
      .then((data) => setWishlist(data.wishlist || []))
      .catch(() => setWishlist([]))
      .finally(() => setLoading(false));
  }, [user, router]);

  const removeFromWishlist = async (artworkId: string) => {
    if (!user) return;
    setRemoving(artworkId);
    try {
      await fetch(`/api/users/${user.id}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId }),
      });
      setWishlist((prev) => prev.filter((a) => a._id !== artworkId));
    } catch {
      // silent fail
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-sm text-gray-500 mt-1">{wishlist.length} saved artwork{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/art-gallery" className="btn-outline-red text-xs">
          Browse More
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={64} className="mx-auto text-gray-200 mb-6" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No saved artworks yet</h2>
          <p className="text-gray-400 mb-8 text-sm">
            Click the heart icon on any artwork to save it here
          </p>
          <Link href="/art-gallery" className="btn-primary">Explore Gallery</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlist.map((art) => (
            <div key={art._id} className="group">
              {/* Image */}
              <div className="relative overflow-hidden bg-gray-100 mb-3">
                <Link href={`/artwork/${art._id}`}>
                  {art.images?.[0] ? (
                    <img
                      src={art.images[0]}
                      alt={art.title}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ minHeight: '200px' }}
                    />
                  ) : (
                    <div className="w-full flex items-center justify-center bg-gray-100 text-4xl" style={{ minHeight: '220px' }}>
                      🎨
                    </div>
                  )}
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(art._id)}
                  disabled={removing === art._id}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white shadow-sm transition-colors"
                  aria-label="Remove from wishlist"
                >
                  {removing === art._id
                    ? <Loader2 size={14} className="animate-spin text-gray-400" />
                    : <Heart size={15} className="fill-[#e63329] text-[#e63329]" />
                  }
                </button>
              </div>

              {/* Info */}
              <Link href={`/artwork/${art._id}`} className="block">
                <h3 className="text-[13px] font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-1">
                  {art.title}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {art.artist?.name} · {art.medium}
                </p>
                <p className="text-[13px] font-bold text-gray-900 mt-1.5">
                  ₹{art.originalPrice.toLocaleString('en-IN')}
                </p>
              </Link>

              {/* Add to cart */}
              <button
                onClick={() => addItem({
                  artworkId: art._id,
                  title: art.title,
                  artistName: art.artist?.name || 'Unknown',
                  price: art.originalPrice,
                  shippingCost: art.shippingCost || 50,
                  image: art.images?.[0] || '',
                  type: 'original',
                })}
                disabled={isInCart(art._id)}
                className={`mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wide border transition-colors ${
                  isInCart(art._id)
                    ? 'bg-gray-900 text-white border-gray-900 cursor-default'
                    : 'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                <ShoppingCart size={12} />
                {isInCart(art._id) ? 'In Cart' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
