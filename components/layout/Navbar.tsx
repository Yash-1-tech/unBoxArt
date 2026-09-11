'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, User, ShoppingCart, Menu, X, ChevronDown,
  Heart, LogOut, Settings, Package, LayoutDashboard, Upload,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';

const galleryCategories = [
  { label: 'All Paintings', href: '/art-gallery' },
  { label: 'Abstract', href: '/art-gallery?style=abstract' },
  { label: 'Landscape', href: '/art-gallery?subject=landscape' },
  { label: 'Portrait', href: '/art-gallery?subject=portrait' },
  { label: 'Still Life', href: '/art-gallery?subject=still-life' },
  { label: 'Watercolor', href: '/art-gallery?medium=watercolor' },
  { label: 'Acrylic', href: '/art-gallery?medium=acrylic' },
  { label: 'Oil', href: '/art-gallery?medium=oil' },
  { label: 'Digital Art', href: '/art-gallery?medium=digital' },
];

interface SearchResult {
  artworks: Array<{
    _id: string;
    title: string;
    images: string[];
    originalPrice: number;
    medium: string;
    artist?: { name: string };
  }>;
  artists: Array<{
    _id: string;
    name: string;
    profileImage?: string;
    location?: string;
  }>;
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { count: cartCount } = useCart();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ artworks: [], artists: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      setTimeout(() => document.addEventListener('click', handler), 0);
      return () => document.removeEventListener('click', handler);
    }
  }, [userMenuOpen]);

  // Live search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults({ artworks: [], artists: [] });
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults({ artworks: [], artists: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => doSearch(q), 300);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults({ artworks: [], artists: [] });
    }
    if (e.key === 'Enter' && searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/art-gallery?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults({ artworks: [], artists: [] });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '';

  const hasResults =
    searchResults.artworks.length > 0 || searchResults.artists.length > 0;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <div className="flex items-center h-16 gap-6">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold tracking-tight">
                unbox<span className="text-[#e63329]">arts</span>
              </span>
              <span className="block text-[9px] tracking-[0.2em] text-gray-400 uppercase -mt-1">
                India's Largest Art Portal
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0 flex-1 ml-4">
              <div
                className="relative"
                onMouseEnter={() => setGalleryOpen(true)}
                onMouseLeave={() => setGalleryOpen(false)}
              >
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#e63329] transition-colors uppercase tracking-wide">
                  Art Gallery <ChevronDown size={14} />
                </button>
                {galleryOpen && (
                  <div className="absolute top-full left-0 bg-white border border-gray-100 shadow-lg py-4 w-56 z-50">
                    {galleryCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="block px-5 py-2 text-sm text-gray-600 hover:text-[#e63329] hover:bg-gray-50 transition-colors"
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {[
                { label: 'Artist', href: '/artists' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#e63329] transition-colors uppercase tracking-wide"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/dashboard/upload"
                className="ml-2 px-4 py-2 text-sm font-semibold text-[#e63329] border border-[#e63329] hover:bg-[#e63329] hover:text-white transition-colors uppercase tracking-wide"
              >
                Sell Paintings
              </Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-1 ml-auto lg:ml-0">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:text-[#e63329] transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                  className="p-1.5 hover:text-[#e63329] transition-colors flex items-center"
                  aria-label="Account"
                >
                  {!loading && user ? (
                    <div className="w-8 h-8 rounded-full bg-[#e63329] text-white text-xs font-semibold flex items-center justify-center">
                      {initials}
                    </div>
                  ) : (
                    <User size={20} />
                  )}
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg w-56 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!loading && user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          <span className="text-[10px] capitalize bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm mt-1 inline-block">
                            {user.role} · {user.membershipTier}
                          </span>
                        </div>
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={15} /> Dashboard
                        </Link>
                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Edit2 size={15} /> Edit Profile
                        </Link>
                        {user.role === 'artist' && (
                          <Link href="/dashboard/upload" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <Upload size={15} /> Upload Artwork
                          </Link>
                        )}
                        <Link href="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Package size={15} /> My Orders
                        </Link>
                        <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Heart size={15} /> Wishlist
                        </Link>
                        <Link href="/dashboard?section=settings" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Settings size={15} /> Settings
                        </Link>
                        <hr className="border-gray-100" />
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/signin" className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          Sign In
                        </Link>
                        <Link href="/auth/signup" className="block px-4 py-3 text-sm font-medium text-[#e63329] hover:bg-red-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link href="/cart" className="p-2 hover:text-[#e63329] transition-colors relative">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#e63329] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                className="lg:hidden p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 py-4 px-6">
            <nav className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-2 pt-2 pb-1">
                Art Gallery
              </span>
              {galleryCategories.slice(0, 4).map((cat) => (
                <Link key={cat.href} href={cat.href} className="px-2 py-2 text-sm text-gray-600 hover:text-[#e63329]" onClick={() => setMobileOpen(false)}>
                  {cat.label}
                </Link>
              ))}
              {[
                { label: 'Artists', href: '/artists' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="px-2 py-2 text-sm font-medium text-gray-700 border-t border-gray-50 hover:text-[#e63329]" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/dashboard" className="mt-2 px-2 py-2 text-sm font-medium text-gray-700 border-t border-gray-100 hover:text-[#e63329]" onClick={() => setMobileOpen(false)}>
                    Dashboard ({user.name})
                  </Link>
                  <button onClick={() => { setMobileOpen(false); logout(); }} className="mt-1 text-left px-2 py-2 text-sm text-red-500">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth/signin" className="mt-3 btn-primary text-center" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
              )}
              <Link href="/dashboard/upload" className="mt-2 btn-outline-red text-center" onClick={() => setMobileOpen(false)}>
                Sell Paintings
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center pt-20 px-4">
          <div className="bg-white w-full max-w-2xl shadow-2xl">
            {/* Input */}
            <div className="flex items-center border-b border-gray-200 px-5 py-4">
              {searchLoading
                ? <Loader2 size={20} className="text-gray-400 flex-shrink-0 animate-spin" />
                : <Search size={20} className="text-gray-400 flex-shrink-0" />
              }
              <input
                ref={searchRef}
                type="text"
                placeholder="Search artworks, artists, styles..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKey}
                className="flex-1 mx-4 text-base outline-none placeholder:text-gray-400"
              />
              <button onClick={closeSearch} className="p-1 hover:text-[#e63329] transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Live results */}
            {hasResults && (
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Artworks */}
                {searchResults.artworks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-5 py-2 bg-gray-50">
                      Artworks
                    </p>
                    {searchResults.artworks.map((art) => (
                      <Link
                        key={art._id}
                        href={`/artwork/${art._id}`}
                        onClick={closeSearch}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-100 flex-shrink-0 overflow-hidden">
                          {art.images?.[0]
                            ? <img src={art.images[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sm">🎨</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{art.title}</p>
                          <p className="text-xs text-gray-400">{art.artist?.name} · {art.medium}</p>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 flex-shrink-0">
                          ₹{art.originalPrice.toLocaleString('en-IN')}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Artists */}
                {searchResults.artists.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-5 py-2 bg-gray-50">
                      Artists
                    </p>
                    {searchResults.artists.map((artist) => (
                      <Link
                        key={artist._id}
                        href={`/artists/${artist._id}`}
                        onClick={closeSearch}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden">
                          {artist.profileImage
                            ? <img src={artist.profileImage} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-500">
                                {artist.name[0]}
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{artist.name}</p>
                          {artist.location && <p className="text-xs text-gray-400">{artist.location}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* View all */}
                <div className="px-5 py-3 border-t border-gray-100">
                  <Link
                    href={`/art-gallery?q=${encodeURIComponent(searchQuery)}`}
                    onClick={closeSearch}
                    className="text-xs text-[#e63329] hover:underline font-medium"
                  >
                    View all results for "{searchQuery}" →
                  </Link>
                </div>
              </div>
            )}

            {/* No results */}
            {searchQuery.length >= 2 && !searchLoading && !hasResults && (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-gray-500">No results for "{searchQuery}"</p>
                <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
              </div>
            )}

            {/* Popular tags (shown when no query) */}
            {searchQuery.length < 2 && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Abstract Art', 'Watercolor', 'Portrait', 'Landscape', 'Acrylic', 'Om Mandala'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        doSearch(tag);
                      }}
                      className="text-xs px-3 py-1.5 border border-gray-200 hover:border-[#e63329] hover:text-[#e63329] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-16" />
    </>
  );
}
