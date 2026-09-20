'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, MessageSquare, Image, ShoppingBag, CreditCard, Settings, LogOut, Plus, CheckCircle, Upload, Edit3, Trash2, Star, Package,} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SellerOrders from '@/components/dashboard/SellerOrders';

const NAV_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'messages', label: 'Messages / Notifications', icon: MessageSquare },
  { id: 'artworks', label: 'Manage Artworks', icon: Image },
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'sales', label: 'My Sales', icon: Package },
  { id: 'payment', label: 'My Payment Details', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'plans', label: 'Plan Systems', icon: Star },
];

const PLANS = [
  {
    name: 'Free',
    price: '₹000',
    period: 'Per Month',
    color: 'bg-blue-600',
    features: ['Upload up to 10 artworks','Artwork visibility','Payment receipts','Bandwidth Visibility','Artwork Analysis',],
    ctaStyle:'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
  },
  {
    name: 'Silver',
    price: '₹25',
    period: 'Per Month',
    sub: '₹20 Per Year',
    color: 'bg-gray-400',
    features: ['Upload up to 50 artworks','Artwork visibility','Payment receipts','Bandwidth Visibility','Artwork Analysis','Support Commissions',],
    ctaStyle:'border border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white',
  },
  {
    name: 'Gold',
    price: '₹59',
    period: 'Per Month',
    sub: '₹49 Per Year',
    color: 'bg-yellow-500',
    badge: 'POPULAR',
    features: ['Upload up to 100 artworks','Artwork visibility','Payment receipts','Bandwidth Visibility','Artwork Analysis','Support Commissions','Advanced Analytics',],
    ctaStyle:'border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white',
  },
  {
    name: 'Platinum',
    price: '₹125',
    period: 'Per Month',
    sub: '₹99 Per Year',
    color: 'bg-purple-600',
    features: ['Unlimited artworks','Artwork visibility','Payment receipts','Bandwidth Visibility','Artwork Analysis','Support Commissions','Advanced Analytics','Expert Consultation','Support from artist',],
    ctaStyle:'border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white',
  },
];

interface Artwork {
  _id: string;
  title: string;
  code: string;
  originalPrice: number;
  images?: string[];
  isAvailable: boolean;
  createdAt?: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileData, setProfileData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    location: '',
    website: '',
  });

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const [artworksError, setArtworksError] = useState('');
  const [editingArtwork, setEditingArtwork] = useState<any | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'artist') {
      setArtworks([]);
      return;
    }
    const fetchArtworks = async () => {
      setArtworksLoading(true);
      setArtworksError('');
      try {
        const params = new URLSearchParams();
        params.set('artist', user.id);
        params.set('limit', '100');
        params.set('sort', 'newest');
        const response = await fetch(
          `/api/artworks?${params.toString()}`
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load your artworks'
          );
        }

        setArtworks(data.artworks || []);
      } catch (error) {
        console.error(
          'Failed to fetch artist artworks:',
          error
        );

        setArtworksError(
          error instanceof Error
            ? error.message
            : 'Failed to load your artworks'
        );
      } finally {
        setArtworksLoading(false);
      }
    };
    fetchArtworks();
  }, [user]);


  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
        }),
      });

      if (res.ok) {
        setSaveMsg('Profile saved!');
      } else {
        setSaveMsg('Failed to save');
      }
    } catch {
      setSaveMsg('Error saving profile');
    } finally {
      setSaving(false);

      setTimeout(() => {
        setSaveMsg('');
      }, 3000);
    }
  };

  const handleDeleteArtwork = async (artworkId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this artwork? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/artworks/${artworkId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete artwork');
      }

      setArtworks((prev) =>
        prev.filter((artwork) => artwork._id !== artworkId)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete artwork');
    }
  };
  
  const handleEditArtwork = (artwork: any) => {
    setEditError('');
    setEditingArtwork({
      ...artwork,
      originalPrice: artwork.originalPrice ?? '',
      digitalPrintPrice: artwork.digitalPrintPrice ?? '',
      shippingCost: artwork.shippingCost ?? 0,
      width: artwork.dimensions?.width ?? '',
      height: artwork.dimensions?.height ?? '',
      unit: artwork.dimensions?.unit ?? 'in',
    });
  };

  const handleSaveArtwork = async () => {
    if (!editingArtwork) return;

    setEditSaving(true);
    setEditError('');

    try {
      const res = await fetch(`/api/artworks/${editingArtwork._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingArtwork.title,
          description: editingArtwork.description || '',
          medium: editingArtwork.medium,
          subject: editingArtwork.subject,
          style: editingArtwork.style || '',
          originalPrice: Number(editingArtwork.originalPrice),
          digitalPrintPrice:
            editingArtwork.digitalPrintPrice === '' ||
            editingArtwork.digitalPrintPrice == null
              ? undefined
              : Number(editingArtwork.digitalPrintPrice),
          shippingCost: Number(editingArtwork.shippingCost),
          stock: Number(editingArtwork.stock),
          isAvailable: editingArtwork.isAvailable,
          dimensions: {
            width: Number(editingArtwork.width),
            height: Number(editingArtwork.height),
            unit: editingArtwork.unit,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update artwork');
      }

      setArtworks((prev) =>
        prev.map((artwork) =>
          artwork._id === data._id ? data : artwork
        )
      );

      setEditingArtwork(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Failed to update artwork'
      );
    } finally {
      setEditSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';

    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatPrice = (price: number) => {
    return `₹${Number(price || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome {user?.name || 'User'} Dashboard
        </h1>

        <nav className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
          <Link
            href="/"
            className="hover:text-[#e63329]"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-600">
            Dashboard
          </span>
          <span>/</span>
          <span className="text-gray-600 capitalize">
            {activeSection}
          </span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 self-start">
          {/* User badge */}
          {user && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-100 rounded-sm">
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-[#e63329] text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                  {getInitials(user.name)}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>

                  <p className="text-[10px] text-gray-400 capitalize">
                    {user.role} · {user.membershipTier}
                  </p>
                </div>

              </div>
            </div>
          )}

          <nav className="space-y-0.5">

            {NAV_ITEMS.map(
              ({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                    activeSection === id
                      ? 'bg-red-50 text-[#e63329] border-l-2 border-[#e63329] font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
                  }`}
                >
                  <Icon
                    size={16}
                    className="flex-shrink-0"
                  />

                  {label}
                </button>
              )
            )}

            <hr className="border-gray-100 my-2" />

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 border-l-2 border-transparent transition-colors"
            >
              <LogOut size={16} />

              Sign Out
            </button>

          </nav>
        </aside>

        {/* Content */}
        <main>
          {activeSection === 'profile' && (
            <div>

              <h2 className="text-base font-semibold text-gray-900 mb-6">
                Profile Settings
              </h2>

              <div className="flex items-center gap-4 mb-8">

                <div className="w-20 h-20 bg-[#e63329] rounded-sm flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {getInitials(user?.name)}
                </div>

                <div className="flex flex-col gap-2">

                  <button className="btn-outline-red text-xs px-4 py-2 flex items-center gap-2">
                    <Upload size={13} />

                    Change Picture
                  </button>

                </div>
              </div>

              <div className="space-y-4 max-w-xl">

                {[
                  {
                    name: 'fullName',
                    label: 'Full Name',
                    placeholder: 'Your full name',
                    type: 'text',
                  },
                  {
                    name: 'email',
                    label: 'Email Address',
                    placeholder: 'your@email.com',
                    type: 'email',
                  },
                  {
                    name: 'phone',
                    label: 'Phone Number',
                    placeholder: '+91 XXXXXXXXXX',
                    type: 'tel',
                  },
                  {
                    name: 'location',
                    label: 'Location',
                    placeholder: 'City, Country',
                    type: 'text',
                  },
                  {
                    name: 'website',
                    label: 'Website',
                    placeholder: 'https://yoursite.com',
                    type: 'url',
                  },
                ].map(
                  ({
                    name,
                    label,
                    placeholder,
                    type,
                  }) => (
                    <div key={name}>

                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        {label}
                      </label>

                      <input
                        type={type}
                        name={name}
                        placeholder={placeholder}
                        value={
                          profileData[
                            name as keyof typeof profileData
                          ]
                        }
                        onChange={handleProfileChange}
                        className="input-field"
                      />

                    </div>
                  )
                )}

                <div>

                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Bio
                  </label>

                  <textarea
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    rows={4}
                    className="input-field resize-none"
                  />

                </div>

                {saveMsg && (
                  <p
                    className={`text-xs px-3 py-2 rounded ${
                      saveMsg.includes('saved')
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {saveMsg}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">

                  <button className="btn-secondary px-8">
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-8 disabled:opacity-60"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save'}
                  </button>

                </div>
              </div>
            </div>
          )}

          {activeSection === 'artworks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Manage Artworks
                </h2>
                {user?.role === 'artist' && (
                  <Link
                    href="/dashboard/upload"
                    className="btn-primary flex items-center gap-2 text-xs"
                  >
                    <Plus size={14} />
                    Add Artwork
                  </Link>
                )}
              </div>
              {/* Non-artist protection */}
              {user?.role !== 'artist' ? (
                <div className="text-sm text-gray-500 text-center py-16 border border-dashed border-gray-200">
                  Artwork management is available only to artist accounts.
                </div>
              ) : artworksLoading ? (

                /* Loading */
                <div className="border border-gray-100">

                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading your artworks...
                  </div>

                  {Array.from({ length: 3 }).map(
                    (_, index) => (
                      <div key={index} className="flex items-center gap-4 px-4 py-4 border-t border-gray-100 animate-pulse">
                        <div className="w-14 h-14 bg-gray-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                          <div className="h-2 bg-gray-100 rounded w-1/4" />
                        </div>
                        <div className="w-20 h-3 bg-gray-100 rounded" />
                      </div>
                    )
                  )}
                </div>
              ) : artworksError ? (

                /* Error */
                <div className="text-center py-16 border border-red-100 bg-red-50">

                  <p className="text-sm text-red-500 mb-2">
                    {artworksError}
                  </p>

                  <button
                    onClick={() =>
                      window.location.reload()
                    }
                    className="text-xs text-[#e63329] hover:underline"
                  >
                    Try Again
                  </button>

                </div>

              ) : artworks.length === 0 ? (

                /* Empty */
                <div className="text-sm text-gray-500 text-center py-16 border border-dashed border-gray-200">

                  <div className="flex justify-center mb-3">
                    <Image
                      size={28}
                      className="text-gray-300"
                    />
                  </div>

                  <p className="mb-3">
                    You haven't uploaded any artworks yet.
                  </p>

                  <Link
                    href="/dashboard/upload"
                    className="text-[#e63329] hover:underline text-xs"
                  >
                    Upload your first artwork
                  </Link>

                </div>

              ) : (

                /* Artwork list */
                <div className="border border-gray-100">

                  {/* Header */}
                  <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">

                    <span>Select</span>

                    <span>Artwork</span>

                    <span>Price</span>

                    <span>Action</span>

                  </div>

                  {/* Rows */}
                  {artworks.map((artwork) => (

                    <div
                      key={artwork._id}
                      className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >

                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        className="accent-[#e63329]"
                        aria-label={`Select ${artwork.title}`}
                      />

                      {/* Artwork */}
                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-14 h-14 flex-shrink-0 bg-gray-100 overflow-hidden">

                          {artwork.images?.[0] ? (

                            <img
                              src={artwork.images[0]}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                              onError={(event) => {
                                (
                                  event.currentTarget
                                ).style.display =
                                  'none';
                              }}
                            />

                          ) : (

                            <div className="w-full h-full flex items-center justify-center text-xl">
                              🎨
                            </div>

                          )}

                        </div>

                        <div className="min-w-0">

                          <Link
                            href={`/artwork/${artwork._id}`}
                            className="text-xs font-semibold text-gray-900 hover:text-[#e63329] line-clamp-1"
                          >
                            {artwork.title}
                          </Link>

                          <p className="text-[10px] text-gray-400">
                            Code: {artwork.code}
                          </p>

                          <span
                            className={`inline-block text-[9px] px-1.5 py-0.5 font-medium mt-1 ${
                              artwork.isAvailable
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {artwork.isAvailable
                              ? 'Active'
                              : 'Unavailable'}
                          </span>

                        </div>

                      </div>

                      {/* Price */}
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatPrice(
                          artwork.originalPrice
                        )}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditArtwork(artwork)}
                          className="p-1.5 hover:text-[#e63329] transition-colors"
                          aria-label="Edit"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteArtwork(artwork._id)}
                          className="p-1.5 hover:text-red-500 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>

                    </div>

                  ))}

                </div>
              )}

            </div>
          )}

          {activeSection === 'orders' && (
            <div>

              <h2 className="text-base font-semibold text-gray-900 mb-6">
                Orders
              </h2>

              <div className="text-sm text-gray-500 text-center py-16 border border-dashed border-gray-200">

                No orders yet.

                {' '}

                <Link
                  href="/art-gallery"
                  className="text-[#e63329] hover:underline"
                >
                  Browse artwork
                </Link>

                {' '}or wait for sales to come in.

              </div>

            </div>
          )}


          {activeSection === 'payment' && (
            <div>

              <h2 className="text-base font-semibold text-gray-900 mb-6">
                My Payment Details
              </h2>

              <div className="max-w-xl space-y-4">

                {[
                  'Bank Account Number',
                  'IFSC Code',
                  'Account Holder Name',
                  'UPI ID',
                ].map((field) => (

                  <div key={field}>

                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {field}
                    </label>

                    <input
                      type="text"
                      placeholder={`Enter ${field}`}
                      className="input-field"
                    />

                  </div>

                ))}

                <button className="btn-primary mt-2">
                  Save Payment Details
                </button>

              </div>

            </div>
          )}


          {activeSection === 'plans' && (
            <div>

              <h2 className="text-base font-semibold text-gray-900 mb-2">
                Plan Systems
              </h2>

              <p className="text-xs text-gray-500 mb-8">
                Current plan:{' '}
                <strong className="capitalize">
                  {user?.membershipTier || 'Free'}
                </strong>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {PLANS.map((plan) => {

                  const isCurrent =
                    plan.name.toLowerCase() ===
                    (user?.membershipTier || 'free');

                  return (

                    <div
                      key={plan.name}
                      className={`border p-5 relative ${
                        isCurrent
                          ? 'border-[#e63329] ring-1 ring-red-100'
                          : 'border-gray-200'
                      }`}
                    >

                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[9px] font-bold px-2.5 py-0.5 tracking-wider">
                          {plan.badge}
                        </span>
                      )}

                      <div
                        className={`w-8 h-8 rounded-full ${plan.color} flex items-center justify-center mb-3`}
                      >
                        <Star
                          size={16}
                          className="text-white fill-white"
                        />
                      </div>

                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                        {plan.name}
                      </p>

                      <p className="text-2xl font-bold text-gray-900">
                        {plan.price}
                      </p>

                      <p className="text-xs text-gray-400 mb-1">
                        {plan.period}
                      </p>

                      {plan.sub && (
                        <p className="text-xs text-gray-400 mb-4">
                          {plan.sub}
                        </p>
                      )}

                      <ul className="space-y-1.5 mb-5">

                        {plan.features.map(
                          (feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 text-xs text-gray-600"
                            >
                              <CheckCircle
                                size={12}
                                className="text-green-500 flex-shrink-0 mt-0.5"
                              />

                              {feature}
                            </li>
                          )
                        )}

                      </ul>

                      <button
                        className={`w-full py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${plan.ctaStyle}`}
                      >
                        {isCurrent
                          ? 'Current Plan'
                          : 'Subscribe'}
                      </button>

                    </div>
                  );
                })}

              </div>

            </div>
          )}

          {activeSection === 'sales' && (
            <SellerOrders
              artistId={user?.id || ''}
            />
          )}

          {activeSection === 'messages' && (
            <div>

              <h2 className="text-base font-semibold text-gray-900 mb-6">
                Messages & Notifications
              </h2>

              <div className="text-sm text-gray-500 text-center py-16 border border-dashed border-gray-200">
                No new messages or notifications.
              </div>

            </div>
          )}

          {activeSection === 'settings' && (
            <div>

              <h2 className="text-base font-semibold text-gray-900 mb-6">
                Settings
              </h2>

              <div className="max-w-xl space-y-6">

                <div>

                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Change Password
                  </h3>

                  {[
                    'Current Password',
                    'New Password',
                    'Confirm New Password',
                  ].map((field) => (

                    <div
                      key={field}
                      className="mb-3"
                    >

                      <label className="block text-xs text-gray-500 mb-1">
                        {field}
                      </label>

                      <input
                        type="password"
                        placeholder={field}
                        className="input-field"
                      />

                    </div>

                  ))}

                  <button className="btn-primary text-xs">
                    Update Password
                  </button>

                </div>

                <div className="border-t border-gray-100 pt-6">

                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Notification Preferences
                  </h3>

                  {[
                    'Email notifications',
                    'SMS notifications',
                    'Order updates',
                    'Marketing emails',
                  ].map((preference) => (

                    <label
                      key={preference}
                      className="flex items-center gap-3 py-2 cursor-pointer"
                    >

                      <input
                        type="checkbox"
                        defaultChecked
                        className="accent-[#e63329]"
                      />

                      <span className="text-sm text-gray-600">
                        {preference}
                      </span>

                    </label>

                  ))}
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-red-600 mb-2">
                    Danger Zone
                  </h3>
                  <button className="text-xs text-red-500 border border-red-200 px-4 py-2 hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}