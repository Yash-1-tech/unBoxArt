'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, User, ShoppingCart, Menu, X, ChevronDown,
  Heart, LogOut, Settings, Package, LayoutDashboard,
} from 'lucide-react';

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

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Mock auth state – replace with real auth
  const isLoggedIn = false;
  const cartCount = 0;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

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
              <span className="font-inter text-2xl font-bold tracking-tight">
                unbox<span className="text-[#e63329]">arts</span>
              </span>
              <span className="block text-[9px] tracking-[0.2em] text-gray-400 uppercase -mt-1">
              India's Largest Art Portal
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0 flex-1 ml-4">
              {/* Art Gallery Dropdown */}
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
                href="/dashboard"
                className="ml-2 px-4 py-2 text-sm font-semibold text-[#e63329] border border-[#e63329] hover:bg-[#e63329] hover:text-white transition-colors uppercase tracking-wide"
              >
                Sell Paintings
              </Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 ml-auto lg:ml-0">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:text-[#e63329] transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* User */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 hover:text-[#e63329] transition-colors"
                  aria-label="Account"
                >
                  <User size={20} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg w-52 z-50">
                    {isLoggedIn ? (
                      <>
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">
                          <LayoutDashboard size={15} /> Dashboard
                        </Link>
                        <Link href="/dashboard/orders" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">
                          <Package size={15} /> My Orders
                        </Link>
                        <Link href="/wishlist" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">
                          <Heart size={15} /> Wishlist
                        </Link>
                        <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">
                          <Settings size={15} /> Settings
                        </Link>
                        <hr className="border-gray-100" />
                        <button className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 w-full text-red-500">
                          <LogOut size={15} /> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/signin" className="block px-4 py-3 text-sm font-medium hover:bg-gray-50">
                          Sign In
                        </Link>
                        <Link href="/auth/signup" className="block px-4 py-3 text-sm font-medium text-[#e63329] hover:bg-red-50">
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

              {/* Mobile menu */}
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
                <Link key={cat.href} href={cat.href} className="px-2 py-2 text-sm text-gray-600 hover:text-[#e63329]">
                  {cat.label}
                </Link>
              ))}
              {[
                { label: 'Artists', href: '/artists' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="px-2 py-2 text-sm font-medium text-gray-700 border-t border-gray-50 hover:text-[#e63329]">
                  {link.label}
                </Link>
              ))}
              <Link href="/dashboard" className="mt-3 btn-primary text-center">
                Sell Paintings
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center pt-28 px-4">
          <div className="bg-white w-full max-w-2xl shadow-2xl">
            <div className="flex items-center border-b border-gray-200 px-5 py-4">
              <Search size={20} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search artworks, artists, styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 mx-4 text-base outline-none placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false);
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/art-gallery?q=${encodeURIComponent(searchQuery)}`;
                  }
                }}
              />
              <button onClick={() => setSearchOpen(false)} className="p-1 hover:text-[#e63329]">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {['Abstract Art', 'Watercolor', 'Portrait', 'Landscape', 'Acrylic'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      window.location.href = `/art-gallery?q=${encodeURIComponent(tag)}`;
                    }}
                    className="text-xs px-3 py-1.5 border border-gray-200 hover:border-[#e63329] hover:text-[#e63329] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
