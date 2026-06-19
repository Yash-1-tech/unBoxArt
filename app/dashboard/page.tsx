'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User, MessageSquare, Image, ShoppingBag, CreditCard,
  Settings, LogOut, Plus, CheckCircle, Upload, Edit3,
  Trash2, MoreHorizontal, Star,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'messages', label: 'Messages / Notifications', icon: MessageSquare },
  { id: 'artworks', label: 'Manage Artworks', icon: Image },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
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
    features: [
      'Upload up to 10 artworks',
      'Artwork visibility',
      'Payment receipts',
      'Bandwidth Visibility',
      'Artwork Analysis',
    ],
    cta: 'Subscribe',
    ctaStyle: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    current: true,
  },
  {
    name: 'Silver',
    price: '₹25',
    period: 'Per Month',
    sub: '₹20 Per Year',
    color: 'bg-gray-400',
    features: [
      'Upload up to 10 artworks',
      'Artwork visibility',
      'Payment receipts',
      'Bandwidth Visibility',
      'Artwork Analysis',
      'Support Commissions',
    ],
    cta: 'Subscribe',
    ctaStyle: 'border border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white',
  },
  {
    name: 'Gold',
    price: '₹59',
    period: 'Per Month',
    sub: '₹49 Per Year',
    color: 'bg-yellow-500',
    badge: 'POPULAR',
    features: [
      'Upload up to 10 artworks',
      'Artwork visibility',
      'Payment receipts',
      'Bandwidth Visibility',
      'Artwork Analysis',
      'Support Commissions',
      'Advanced Analytics',
    ],
    cta: 'Subscribe',
    ctaStyle: 'border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white',
  },
  {
    name: 'Platinum',
    price: '₹125',
    period: 'Per Month',
    sub: '₹99 Per Year',
    color: 'bg-purple-600',
    features: [
      'Upload up to 10 artworks',
      'Artwork visibility',
      'Payment receipts',
      'Bandwidth Visibility',
      'Artwork Analysis',
      'Support Commissions',
      'Advanced Analytics',
      'Expert Consultation',
      'Support from artist',
    ],
    cta: 'Subscribe',
    ctaStyle: 'border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white',
  },
];

const ARTWORKS = [
  { id: '1', title: 'Monotype of Blank Landscapes, G1', code: 'HF-428854', price: 2500, status: 'Active', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=100&q=80' },
  { id: '2', title: 'Monotype of Blank Landscapes, G2', code: 'HF-428854', price: 2500, status: 'Draft', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=100&q=80' },
  { id: '3', title: 'R Peacock in Study, G1', code: 'HF-428855', price: 4995, status: 'Active', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100&q=80' },
];

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profileData, setProfileData] = useState({
    fullName: 'User Name',
    email: 'user@example.com',
    phone: '+91 9876543210',
    bio: '',
    location: '',
    website: '',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold text-gray-900">
          Welcome User Name Dashboard
        </h1>
        <nav className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
          <Link href="/" className="hover:text-[#e63329]">Join Account</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-[#e63329]">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-600">My Profile</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* ── Sidebar ── */}
        <aside className="lg:sticky lg:top-24 self-start">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                  activeSection === id
                    ? 'bg-red-50 text-[#e63329] border-l-2 border-[#e63329] font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
                }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                {label}
              </button>
            ))}
            <hr className="border-gray-100 my-2" />
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 border-l-2 border-transparent transition-colors">
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main>
          {/* My Profile */}
          {activeSection === 'profile' && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-6">Profile Settings</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                  <User size={32} className="text-gray-400" />
                </div>
                <div className="flex flex-col gap-2">
                  <button className="btn-outline-red text-xs px-4 py-2">
                    <Upload size={13} /> Change Picture
                  </button>
                  <button className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-4 py-2 transition-colors">
                    Delete Picture
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 max-w-xl">
                {[
                  { name: 'fullName', label: 'Full Name', placeholder: 'Your full name', type: 'text' },
                  { name: 'email', label: 'Email Address', placeholder: 'your@email.com', type: 'email' },
                  { name: 'phone', label: 'Phone Number', placeholder: '+91 XXXXXXXXXX', type: 'tel' },
                  { name: 'location', label: 'Location', placeholder: 'City, Country', type: 'text' },
                  { name: 'website', label: 'Website', placeholder: 'https://yoursite.com', type: 'url' },
                ].map(({ name, label, placeholder, type }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      placeholder={placeholder}
                      value={profileData[name as keyof typeof profileData] as string}
                      onChange={handleProfileChange}
                      className="input-field"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                  <textarea
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button className="btn-secondary px-8">Edit</button>
                  <button className="btn-primary px-8">Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Artworks */}
          {activeSection === 'artworks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Manage Artworks
                </h2>
                <button className="btn-primary flex items-center gap-2 text-xs">
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 mb-5">
                {['All', 'Active', 'Draft'].map((filter) => (
                  <button
                    key={filter}
                    className={`text-xs px-3 py-1.5 border transition-colors ${
                      filter === 'All'
                        ? 'bg-green-500 text-white border-green-500'
                        : filter === 'Draft'
                        ? 'bg-[#e63329] text-white border-[#e63329]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
                <span className="text-xs text-gray-400 ml-auto">All Filters ▼</span>
              </div>

              {/* Artwork List */}
              <div className="border border-gray-100">
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <span>Select all</span>
                  <span>Artwork</span>
                  <span>Price</span>
                  <span>Action</span>
                </div>

                {ARTWORKS.map((artwork) => (
                  <div
                    key={artwork.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <input type="checkbox" className="accent-[#e63329]" />

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-gray-100">
                        <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 line-clamp-1">{artwork.title}</p>
                        <p className="text-[10px] text-gray-400">Code: {artwork.code}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 font-medium ${
                          artwork.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {artwork.status}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-2">{artwork.code.split('-')[1]} • ···</span>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-gray-900">₹{artwork.price.toLocaleString()}</p>

                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 hover:text-[#e63329] transition-colors" aria-label="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button className="p-1.5 hover:text-red-500 transition-colors" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                      <button className="p-1.5 hover:text-gray-600 transition-colors" aria-label="More">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {activeSection === 'orders' && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-6">Orders</h2>
              <div className="text-sm text-gray-500 text-center py-16 border border-dashed border-gray-200">
                No orders yet. Start selling or buying artwork!
              </div>
            </div>
          )}

          {/* Payment */}
          {activeSection === 'payment' && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-6">My Payment Details</h2>
              <div className="max-w-xl space-y-4">
                {['Bank Account Number', 'IFSC Code', 'Account Holder Name', 'UPI ID'].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{field}</label>
                    <input type="text" placeholder={`Enter ${field}`} className="input-field" />
                  </div>
                ))}
                <button className="btn-primary mt-2">Save Payment Details</button>
              </div>
            </div>
          )}

          {/* Plans */}
          {activeSection === 'plans' && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Plan Systems</h2>
              <p className="text-xs text-gray-500 mb-8">Choose the plan that works best for you</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.name}
                    className={`border rounded-none p-5 relative ${
                      plan.current ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[9px] font-bold px-2.5 py-0.5 tracking-wider">
                        {plan.badge}
                      </span>
                    )}

                    <div className={`w-8 h-8 rounded-full ${plan.color} flex items-center justify-center mb-3`}>
                      <Star size={16} className="text-white fill-white" />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{plan.name}</p>
                    <p className="font-playfair text-2xl font-bold text-gray-900">{plan.price}</p>
                    <p className="text-xs text-gray-400 mb-1">{plan.period}</p>
                    {plan.sub && <p className="text-xs text-gray-400 mb-4">{plan.sub}</p>}

                    <ul className="space-y-1.5 mb-5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <button className={`w-full py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${plan.ctaStyle}`}>
                      {plan.current ? 'Current Plan' : plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {activeSection === 'messages' && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-6">Messages & Notifications</h2>
              <div className="text-sm text-gray-500 text-center py-16 border border-dashed border-gray-200">
                No new messages or notifications.
              </div>
            </div>
          )}

          {/* Settings */}
          {activeSection === 'settings' && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-6">Settings</h2>
              <div className="max-w-xl space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Change Password</h3>
                  {['Current Password', 'New Password', 'Confirm New Password'].map((field) => (
                    <div key={field} className="mb-3">
                      <label className="block text-xs text-gray-500 mb-1">{field}</label>
                      <input type="password" placeholder={field} className="input-field" />
                    </div>
                  ))}
                  <button className="btn-primary text-xs">Update Password</button>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Notification Preferences</h3>
                  {['Email notifications', 'SMS notifications', 'Order updates', 'Marketing emails'].map((pref) => (
                    <label key={pref} className="flex items-center gap-3 py-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-[#e63329]" />
                      <span className="text-sm text-gray-600">{pref}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
