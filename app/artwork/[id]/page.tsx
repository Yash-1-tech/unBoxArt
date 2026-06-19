'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Heart, ShoppingCart, Zap, ZoomIn, ChevronDown,
  ChevronLeft, ChevronRight, MapPin, Shield, Truck,
  RotateCcw, Star, Eye, MessageSquare,
} from 'lucide-react';
import ArtworkCard from '@/components/ui/ArtworkCard';
import ValueProps from '@/components/home/ValueProps';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ARTWORK = {
  id: '1',
  title: 'Painting Title Painting Title Painting Title',
  code: 'HF-4380754',
  artist: { id: 'a1', name: 'Kshoni Painter Brown' },
  medium: 'Silver Colour or Copper',
  originalSize: '1/4" × 3/8"',
  printSize: '10" × 14"',
  rating: 4.3,
  reviews: 34,
  views: 201,
  likes: 89,
  originalPrice: 190000,
  digitalPrintPrice: 4999,
  shippingCost: 50,
  images: [
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=900&q=85',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=900&q=85',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=85',
    'https://images.unsplash.com/photo-1549887534-1541e9326688?w=900&q=85',
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=900&q=85',
  ],
};

const RECOMMENDATIONS = Array.from({ length: 4 }, (_, i) => ({
  id: String(i + 100),
  title: 'Title Title Title Title Title',
  artistName: 'Kshoni Painter',
  medium: 'Water Colour',
  dimensions: '36"×30"',
  price: 80000 + i * 12000,
  image: [
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
  ][i],
  likes: 120 + i * 10,
  views: 300 + i * 40,
  comments: 8 + i,
  rating: 4.2 + (i * 0.1),
}));

const ACCORDION_ITEMS = [
  {
    id: 'shipping',
    label: 'Shipping',
    content: 'All artworks are carefully packaged and shipped worldwide. Standard delivery takes 7–14 business days. Express options available at checkout. Above ₹999 value will be free. Artwork is shipped using DHL, FedEx, DTDC and Bluedart.',
  },
  {
    id: 'warranties',
    label: 'Warranties',
    content: 'All original artworks come with a certificate of authenticity signed by the artist. Digital prints are printed on archival quality paper and are fade-resistant for up to 75 years.',
  },
  {
    id: 'payment',
    label: 'Payment Terms',
    content: 'We accept Visa, Mastercard, American Express, PayPal, UPI, NEFT, RTGS, and Wire Transfer. All payments are secured with 256-bit SSL encryption.',
  },
  {
    id: 'returns',
    label: 'Returns & Refunds',
    content: 'Returns are accepted within 7 days of delivery for original artworks in original condition. Digital prints are non-refundable once downloaded. Contact our support team to initiate a return.',
  },
  {
    id: 'about',
    label: 'About This Artwork',
    content: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    extra: 'Artist: Kshoni Printer Brown\n\nLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s.',
  },
];

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'print' | 'original'>('print');
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>('shipping');
  const [activeInfoTab, setActiveInfoTab] = useState('shipping');
  const [wishlist, setWishlist] = useState(false);
  const [inCart, setInCart] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const price = activeTab === 'print' ? ARTWORK.digitalPrintPrice : ARTWORK.originalPrice;
  const total = price + ARTWORK.shippingCost;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const checkPincode = () => {
    if (pincode.length === 6) {
      setPincodeResult('✓ Delivery available — Estimated by August 1, 2025');
    } else {
      setPincodeResult('Please enter a valid 6-digit pincode');
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-4">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#e63329]">Home</Link>
          <span>/</span>
          <Link href="/art-gallery" className="hover:text-[#e63329]">Gallery</Link>
          <span>/</span>
          <span className="text-gray-600">Product Details</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Left: Image Gallery ── */}
          <div>
            {/* Main Image */}
            <div
              className="relative overflow-hidden bg-gray-100 cursor-zoom-in mb-3"
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                ref={imgRef}
                src={ARTWORK.images[selectedImage]}
                alt={ARTWORK.title}
                className={`w-full object-contain transition-transform duration-200 ${
                  zoomed ? 'scale-150' : 'scale-100'
                }`}
                style={
                  zoomed
                    ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                    : {}
                }
              />
              {/* Zoom icon */}
              <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center pointer-events-none">
                <ZoomIn size={16} className="text-gray-600" />
              </div>

              {/* Nav arrows */}
              {selectedImage > 0 && (
                <button
                  onClick={() => setSelectedImage(selectedImage - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center hover:bg-white"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              {selectedImage < ARTWORK.images.length - 1 && (
                <button
                  onClick={() => setSelectedImage(selectedImage + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center hover:bg-white"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {ARTWORK.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors ${
                    i === selectedImage ? 'border-[#e63329]' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: Checkout Panel ── */}
          <div>
            {/* Tab Switcher */}
            <div className="flex border-b border-gray-200 mb-5">
              {(['print', 'original'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-[#e63329] text-[#e63329]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'print' ? 'Digital Print' : 'Original'}
                </button>
              ))}
            </div>

            {/* Title & Artist */}
            <h1 className="font-playfair text-xl font-bold text-gray-900 leading-snug mb-1">
              {ARTWORK.title}
            </h1>
            <p className="text-sm text-gray-500 mb-3">
              Artist:{' '}
              <Link href={`/artists/${ARTWORK.artist.id}`} className="text-[#e63329] hover:underline">
                {ARTWORK.artist.name}
              </Link>
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm mb-4 border-t border-gray-100 pt-4">
              {[
                ['Medium', ARTWORK.medium],
                ['Original Size', ARTWORK.originalSize],
                ['Print Size', ARTWORK.printSize],
              ].map(([label, val]) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs min-w-[70px]">{label}</span>
                  <span className="text-gray-800 text-xs">{val}</span>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={13} className={s <= Math.round(ARTWORK.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-xs text-gray-500">{ARTWORK.rating}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                <Eye size={11} /> {ARTWORK.views}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MessageSquare size={11} /> {ARTWORK.reviews}
              </span>
            </div>

            {/* Print options (visible in print tab) */}
            {activeTab === 'print' && (
              <div className="space-y-3 mb-5">
                {/* Print Medium */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Print Medium
                  </label>
                  <div className="relative">
                    <select className="w-full border border-gray-200 px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:border-[#e63329]">
                      <option>Canvas</option>
                      <option>Photo Paper</option>
                      <option>Fine Art Paper</option>
                      <option>Metal</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Print Size */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Print Size
                  </label>
                  <div className="relative">
                    <select className="w-full border border-gray-200 px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:border-[#e63329]">
                      <option>10" × 14"</option>
                      <option>16" × 20"</option>
                      <option>20" × 28"</option>
                      <option>24" × 36"</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Sub Qty
                  </label>
                  <div className="relative">
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full border border-gray-200 px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:border-[#e63329]"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Options */}
            <div className="mb-5 border-t border-gray-100 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Delivery Options
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Enter your zip code/pincode to check availability and delivery time.
              </p>
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
                <button
                  onClick={checkPincode}
                  className="px-4 py-2.5 text-xs font-semibold border border-gray-900 hover:bg-gray-900 hover:text-white transition-colors uppercase"
                >
                  Check
                </button>
              </div>
              {pincodeResult && (
                <p className={`text-xs mt-2 ${pincodeResult.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                  {pincodeResult}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-500">Shipping Cost</span>
                <span className="font-semibold">${ARTWORK.shippingCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Cost</span>
                <span className="text-2xl font-playfair font-bold text-gray-900">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5">
              <button className="w-full btn-primary flex items-center justify-center gap-2 py-3.5">
                <Zap size={16} />
                Buy It Now
              </button>
              <button
                onClick={() => setInCart(!inCart)}
                className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold uppercase tracking-wide border transition-colors ${
                  inCart
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                }`}
              >
                <ShoppingCart size={16} />
                {inCart ? 'In Cart ✓' : 'Add to Cart'}
              </button>
              <button
                onClick={() => setWishlist(!wishlist)}
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
                  <Icon size={14} className="text-gray-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion / Info Tabs Section */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 border-t border-gray-100">
        {/* Info Tab Nav */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
          {['Shipping', 'Warranties', 'Payment Terms', 'Returns'].map((tab) => {
            const key = tab.toLowerCase().replace(/\s+/g, '-');
            return (
              <button
                key={tab}
                onClick={() => setActiveInfoTab(key)}
                className={`flex-shrink-0 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                  activeInfoTab === key
                    ? 'border-[#e63329] text-[#e63329]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="text-sm text-gray-600 leading-relaxed max-w-3xl">
          {activeInfoTab === 'shipping' && (
            <div>
              <p className="mb-4">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
                has been the industry's standard dummy text ever since the 1500s, when an unknown printer
                took a galley of type and scrambled it to make a type specimen book. It has survived not
                only five centuries, but also the leap into electronic typesetting, remaining essentially
                unchanged.
              </p>
              <h4 className="text-sm font-semibold text-gray-800 mb-2 mt-5">About This Artwork</h4>
              <p className="text-xs text-gray-500 mb-1">Artist: Kshoni Printer Brown</p>
              <p className="mb-3">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
                has been the industry's standard dummy text ever since the 1500s, when an unknown printer
                took a galley of type and scrambled it.
              </p>
              <p>
                It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum
                passages, and more recently with desktop publishing software like Aldus PageMaker including
                versions of Lorem Ipsum.
              </p>
            </div>
          )}
          {activeInfoTab === 'warranties' && (
            <p>All original artworks come with a certificate of authenticity signed by the artist. Digital prints are printed on archival quality paper and are fade-resistant for up to 75 years under normal display conditions.</p>
          )}
          {activeInfoTab === 'payment-terms' && (
            <p>We accept Visa, Mastercard, American Express, PayPal, UPI, NEFT, RTGS, and Wire Transfer. All payments are secured with 256-bit SSL encryption. EMI options available for orders above ₹5,000.</p>
          )}
          {activeInfoTab === 'returns' && (
            <p>Returns are accepted within 7 days of delivery for original artworks in original, undamaged condition. Digital prints are non-refundable once downloaded. Contact our support team at returns@unboxarts.com to initiate a return.</p>
          )}
        </div>
      </div>

      {/* You Might Like */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 border-t border-gray-100">
        <div className="section-header">
          <h2 className="section-title">You Might Like</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {RECOMMENDATIONS.map((art) => (
            <ArtworkCard key={art.id} {...art} />
          ))}
        </div>
      </div>

      {/* Recently Viewed */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 border-t border-gray-100">
        <div className="section-header">
          <h2 className="section-title">Recently Viewed</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {RECOMMENDATIONS.concat(RECOMMENDATIONS.slice(0, 1)).map((art, i) => (
            <ArtworkCard key={`rv-${i}`} {...art} id={String(art.id + '-rv')} />
          ))}
        </div>
      </div>

      <ValueProps />
    </div>
  );
}
