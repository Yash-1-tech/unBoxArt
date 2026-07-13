'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, ShoppingCart, Zap, ZoomIn, ChevronLeft, ChevronRight,
  MapPin, Shield, Truck, RotateCcw, Star, Eye, MessageSquare, Loader2,
} from 'lucide-react';
import ArtworkCard from '@/components/ui/ArtworkCard';
import ValueProps from '@/components/home/ValueProps';

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

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'print' | 'original'>('print');
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState('');
  const [activeInfoTab, setActiveInfoTab] = useState('shipping');
  const [wishlist, setWishlist] = useState(false);
  const [inCart, setInCart] = useState(false);
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
        if (!data.digitalPrintPrice) setActiveTab('original');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch('/api/artworks?limit=4&sort=popular')
      .then((res) => res.json())
      .then((data) => setRecommendations(data.artworks || []))
      .catch(() => setRecommendations([]));
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
        ? '✓ Delivery available — Estimated 7-10 business days'
        : 'Please enter a valid 6-digit pincode'
    );
  };

  const toggleLike = async () => {
    setWishlist(!wishlist);
    await fetch(`/api/artworks/${id}/like`, { method: 'POST' }).catch(() => {});
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
        <p className="text-gray-500">{error || 'Artwork not found'}</p>
        <Link href="/art-gallery" className="text-[#e63329] text-sm mt-4 inline-block hover:underline">
          ← Back to Gallery
        </Link>
      </div>
    );
  }

  const price = activeTab === 'print' && artwork.digitalPrintPrice ? artwork.digitalPrintPrice : artwork.originalPrice;
  const total = price + (artwork.shippingCost || 50);
  const images = artwork.images?.length ? artwork.images : [''];

  return (
    <div>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-4">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#e63329]">Home</Link>
          <span>/</span>
          <Link href="/art-gallery" className="hover:text-[#e63329]">Gallery</Link>
          <span>/</span>
          <span className="text-gray-600 line-clamp-1">{artwork.title}</span>
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
                <div className="w-full aspect-square flex items-center justify-center text-5xl">🎨</div>
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
                    className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                      activeTab === tab ? 'border-[#e63329] text-[#e63329]' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'print' ? 'Digital Print' : 'Original'}
                  </button>
                ))}
              </div>
            )}

            <h1 className="text-xl font-bold text-gray-900 leading-snug mb-1">{artwork.title}</h1>
            {artwork.artist && (
              <p className="text-sm text-gray-500 mb-3">
                Artist: <Link href={`/artists/${artwork.artist._id}`} className="text-[#e63329] hover:underline">{artwork.artist.name}</Link>
              </p>
            )}

            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm mb-4 border-t border-gray-100 pt-4">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-xs min-w-[70px]">Medium</span>
                <span className="text-gray-800 text-xs">{artwork.medium}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-xs min-w-[70px]">Size</span>
                <span className="text-gray-800 text-xs">{artwork.dimensions?.width}" × {artwork.dimensions?.height}"</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={13} className={s <= Math.round(artwork.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-xs text-gray-500">{artwork.avgRating || 0}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400 ml-1"><Eye size={11} /> {artwork.views}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><MessageSquare size={11} /> {artwork.reviewCount}</span>
            </div>

            <div className="mb-5 border-t border-gray-100 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Delivery Options</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-gray-200 px-3">
                  <MapPin size={13} className="text-gray-400 mr-2 flex-shrink-0" />
                  <input type="text" placeholder="Enter pincode" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 py-2.5 text-sm outline-none" maxLength={6} />
                </div>
                <button onClick={checkPincode} className="px-4 py-2.5 text-xs font-semibold border border-gray-900 hover:bg-gray-900 hover:text-white transition-colors uppercase">Check</button>
              </div>
              {pincodeResult && <p className={`text-xs mt-2 ${pincodeResult.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{pincodeResult}</p>}
            </div>

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

            <div className="space-y-2.5">
              <button className="w-full btn-primary flex items-center justify-center gap-2 py-3.5">
                <Zap size={16} /> Buy It Now
              </button>
              <button onClick={() => setInCart(!inCart)} className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold uppercase tracking-wide border transition-colors ${inCart ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'}`}>
                <ShoppingCart size={16} /> {inCart ? 'In Cart ✓' : 'Add to Cart'}
              </button>
              <button onClick={toggleLike} className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold uppercase tracking-wide border transition-colors ${wishlist ? 'border-[#e63329] text-[#e63329] bg-red-50' : 'border-gray-300 text-gray-600 hover:border-[#e63329] hover:text-[#e63329]'}`}>
                <Heart size={16} className={wishlist ? 'fill-[#e63329]' : ''} /> {wishlist ? 'In Wishlist ✓' : 'Add to Wishlist'}
              </button>
            </div>

            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
              {[{ Icon: Shield, label: 'Secure Payment' }, { Icon: Truck, label: 'Free Shipping' }, { Icon: RotateCcw, label: 'Easy Returns' }].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Icon size={14} className="text-gray-400" /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {artwork.description && (
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 border-t border-gray-100">
          <h2 className="section-title mb-4">About This Artwork</h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">{artwork.description}</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 border-t border-gray-100">
          <div className="section-header"><h2 className="section-title">You Might Like</h2></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {recommendations.filter((r) => r._id !== artwork._id).slice(0, 4).map((art) => (
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
