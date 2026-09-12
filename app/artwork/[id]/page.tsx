'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, ShoppingCart, Zap, ZoomIn, ChevronLeft, ChevronRight,
  MapPin, Shield, Truck, RotateCcw, Star, Eye, MessageSquare, Loader2, Check,
} from 'lucide-react';
import ArtworkCard from '@/components/ui/ArtworkCard';
import ValueProps from '@/components/home/ValueProps';
import { useCart } from '@/lib/CartContext';
import { useRouter } from 'next/navigation';

interface Artwork {
  _id: string;
  title: string;
  code: string;
  description?: string;
  images: string[];
  medium: string;
  dimensions: { width: number; height: number; unit: string };
  originalPrice: number;
  digitalPrintPrice?: number;
  shippingCost: number;
  avgRating: number;
  reviewCount: number;
  views: number;
  likes: number;
  artist?: { _id: string; name: string };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { addItem, isInCart } = useCart();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'print' | 'original'>('original');
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState('');
  const [activeInfoTab, setActiveInfoTab] = useState('shipping');
  const [wishlist, setWishlist] = useState(false);
  const [recommendations, setRecommendations] = useState<Artwork[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/artworks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setArtwork(data);
        setActiveTab(data.digitalPrintPrice ? 'print' : 'original');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch('/api/artworks?limit=4&sort=popular')
      .then((res) => res.json())
      .then((data) => setRecommendations(data.artworks || []))
      .catch(() => {});
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const checkPincode = () => {
    setPincodeResult(
      pincode.length === 6
        ? '✓ Delivery available — Estimated 7–10 business days'
        : 'Please enter a valid 6-digit pincode'
    );
  };

  const handleLike = async () => {
    setWishlist(!wishlist);
    await fetch(`/api/artworks/${id}/like`, { method: 'POST' }).catch(() => {});
  };

  const handleAddToCart = () => {
    if (!artwork) return;
    addItem({
      artworkId: artwork._id,
      title: artwork.title,
      artistName: artwork.artist?.name || 'Unknown Artist',
      price: activeTab === 'print' && artwork.digitalPrintPrice
        ? artwork.digitalPrintPrice
        : artwork.originalPrice,
      shippingCost: artwork.shippingCost || 50,
      image: artwork.images?.[0] || '',
      type: activeTab === 'print' ? 'digital_print' : 'original',
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-32 text-center">
        <p className="text-gray-500 mb-4">{error || 'Artwork not found'}</p>
        <Link href="/art-gallery" className="text-[#e63329] text-sm hover:underline">← Back to Gallery</Link>
      </div>
    );
  }

  const price = activeTab === 'print' && artwork.digitalPrintPrice
    ? artwork.digitalPrintPrice
    : artwork.originalPrice;
  const total = price + (artwork.shippingCost || 50);
  const images = artwork.images?.length ? artwork.images : [''];
  const alreadyInCart = isInCart(artwork._id);

  return (
    <div>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-4">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#e63329]">Home</Link>
          <span>/</span>
          <Link href="/art-gallery" className="hover:text-[#e63329]">Gallery</Link>
          <span>/</span>
          <span className="text-gray-600 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {artwork.title}
          </span>
        </nav>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Left: Images */}
          <div>
            <div
              className="relative overflow-hidden bg-gray-100 cursor-zoom-in mb-3"
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              {images[selectedImage] ? (
                <img
                  ref={imgRef}
                  src={images[selectedImage]}
                  alt={artwork.title}
                  className={`w-full object-contain transition-transform duration-200 ${zoomed ? 'scale-150' : 'scale-100'}`}
                  style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-5xl bg-gray-100">🎨</div>
              )}
              <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center pointer-events-none">
                <ZoomIn size={16} className="text-gray-600" />
              </div>
              {selectedImage > 0 && (
                <button onClick={() => setSelectedImage(selectedImage - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center hover:bg-white">
                  <ChevronLeft size={16} />
                </button>
              )}
              {selectedImage < images.length - 1 && (
                <button onClick={() => setSelectedImage(selectedImage + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center hover:bg-white">
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-[#e63329]' : 'border-transparent hover:border-gray-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Checkout */}
          <div>
            {artwork.digitalPrintPrice && (
              <div className="flex border-b border-gray-200 mb-5">
                {(['print', 'original'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#e63329] text-[#e63329]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab === 'print' ? 'Digital Print' : 'Original'}
                  </button>
                ))}
              </div>
            )}

            <h1 className="text-xl font-bold text-gray-900 leading-snug mb-1">{artwork.title}</h1>
            {artwork.artist && (
              <p className="text-sm text-gray-500 mb-3">
                Artist:{' '}
                <Link href={`/artists/${artwork.artist._id}`} className="text-[#e63329] hover:underline">
                  {artwork.artist.name}
                </Link>
              </p>
            )}

            <div className="grid grid-cols-2 gap-y-2 gap-x-6 mb-4 border-t border-gray-100 pt-4">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-xs min-w-[70px]">Medium</span>
                <span className="text-gray-800 text-xs">{artwork.medium}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-xs min-w-[70px]">Size</span>
                <span className="text-gray-800 text-xs">{artwork.dimensions?.width}" × {artwork.dimensions?.height}"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-xs min-w-[70px]">Code</span>
                <span className="text-gray-800 text-xs">{artwork.code}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={13} className={s <= Math.round(artwork.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-xs text-gray-500">{artwork.avgRating || 0}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400 ml-1"><Eye size={11} /> {artwork.views}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><MessageSquare size={11} /> {artwork.reviewCount}</span>
            </div>

            {/* Pincode checker */}
            <div className="mb-5 border-t border-gray-100 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Delivery Options
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-gray-200 px-3">
                  <MapPin size={13} className="text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 py-2.5 text-sm outline-none"
                    maxLength={6}
                  />
                </div>
                <button onClick={checkPincode} className="px-4 py-2.5 text-xs font-semibold border border-gray-900 hover:bg-gray-900 hover:text-white transition-colors uppercase">
                  Check
                </button>
              </div>
              {pincodeResult && (
                <p className={`text-xs mt-2 ${pincodeResult.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                  {pincodeResult}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-500">Shipping Cost</span>
                <span className="font-semibold">₹{artwork.shippingCost || 50}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Cost</span>
                <span className="text-2xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5">
              <button
                onClick={handleBuyNow}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
              >
                <Zap size={16} /> Buy It Now
              </button>

              <button
                onClick={handleAddToCart}
                disabled={alreadyInCart}
                className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold uppercase tracking-wide border transition-colors ${
                  alreadyInCart
                    ? 'bg-gray-900 text-white border-gray-900 cursor-default'
                    : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                }`}
              >
                {alreadyInCart ? <><Check size={16} /> In Cart</> : <><ShoppingCart size={16} /> Add to Cart</>}
              </button>

              {alreadyInCart && (
                <Link
                  href="/cart"
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold uppercase tracking-wide border border-[#e63329] text-[#e63329] hover:bg-[#e63329] hover:text-white transition-colors"
                >
                  View Cart
                </Link>
              )}

              <button
                onClick={handleLike}
                className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold uppercase tracking-wide border transition-colors ${
                  wishlist
                    ? 'border-[#e63329] text-[#e63329] bg-red-50'
                    : 'border-gray-300 text-gray-600 hover:border-[#e63329] hover:text-[#e63329]'
                }`}
              >
                <Heart size={16} className={wishlist ? 'fill-[#e63329]' : ''} />
                {wishlist ? 'In Wishlist ✓' : 'Add to Wishlist'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
              {[
                { Icon: Shield, label: 'Secure Payment' },
                { Icon: Truck, label: 'Free Shipping' },
                { Icon: RotateCcw, label: 'Easy Returns' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Icon size={14} className="text-gray-400" /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Tabs */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 border-t border-gray-100">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
          {['Shipping', 'Warranties', 'Payment Terms', 'Returns'].map((tab) => {
            const key = tab.toLowerCase().replace(/\s+/g, '-');
            return (
              <button
                key={tab}
                onClick={() => setActiveInfoTab(key)}
                className={`flex-shrink-0 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                  activeInfoTab === key ? 'border-[#e63329] text-[#e63329]' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <div className="text-sm text-gray-600 leading-relaxed max-w-3xl">
          {activeInfoTab === 'shipping' && (
            <p>
              All artworks are carefully packaged and shipped worldwide. Standard delivery takes 7–14 business days.
              Above ₹999 value shipping is free. We use DHL, FedEx, DTDC and Bluedart.
              {artwork.description && <><br /><br /><strong>About this artwork:</strong><br />{artwork.description}</>}
            </p>
          )}
          {activeInfoTab === 'warranties' && (
            <p>All original artworks come with a certificate of authenticity signed by the artist. Digital prints are printed on archival quality paper and are fade-resistant for up to 75 years.</p>
          )}
          {activeInfoTab === 'payment-terms' && (
            <p>We accept Visa, Mastercard, American Express, PayPal, UPI, NEFT, RTGS, and Wire Transfer. All payments are secured with 256-bit SSL encryption.</p>
          )}
          {activeInfoTab === 'returns' && (
            <p>Returns accepted within 7 days of delivery for original artworks in undamaged condition. Digital prints are non-refundable once downloaded. Contact support@unboxarts.com to initiate a return.</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 border-t border-gray-100">
          <div className="section-header">
            <h2 className="section-title">You Might Like</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {recommendations
              .filter((r) => r._id !== artwork._id)
              .slice(0, 4)
              .map((art) => (
                <ArtworkCard
                  key={art._id}
                  id={art._id}
                  title={art.title}
                  artistName={art.artist?.name || 'Unknown'}
                  medium={art.medium}
                  dimensions={`${art.dimensions?.width}"×${art.dimensions?.height}"`}
                  price={art.originalPrice}
                  image={art.images?.[0] || ''}
                  likes={art.likes}
                  views={art.views}
                  comments={art.reviewCount}
                  rating={art.avgRating}
                />
              ))}
          </div>
        </div>
      )}

      <ValueProps />
    </div>
  );
}
