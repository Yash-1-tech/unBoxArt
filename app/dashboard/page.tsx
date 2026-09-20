'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, MessageSquare, Image, ShoppingBag, CreditCard,
  Settings, LogOut, Plus, CheckCircle, Upload, Edit3,
  Trash2, Star, Package, Truck, Clock, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SellerOrders from '@/components/dashboard/SellerOrders';

const NAV_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'messages', label: 'Messages / Notifications', icon: MessageSquare },
  { id: 'artworks', label: 'Manage Artworks', icon: Image, artistOnly: true },
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'sales', label: 'My Sales', icon: Package, artistOnly: true },
  { id: 'payment', label: 'My Payment Details', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'plans', label: 'Plan Systems', icon: Star },
];

const PLANS = [
  { name: 'Free', price: '₹000', period: 'Per Month', color: 'bg-blue-600', features: ['Upload up to 10 artworks', 'Artwork visibility', 'Payment receipts', 'Bandwidth Visibility', 'Artwork Analysis'], ctaStyle: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white', current: true },
  { name: 'Silver', price: '₹25', period: 'Per Month', sub: '₹20 Per Year', color: 'bg-gray-400', features: ['Upload up to 50 artworks', 'Artwork visibility', 'Payment receipts', 'Bandwidth Visibility', 'Artwork Analysis', 'Support Commissions'], ctaStyle: 'border border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white' },
  { name: 'Gold', price: '₹59', period: 'Per Month', sub: '₹49 Per Year', color: 'bg-yellow-500', badge: 'POPULAR', features: ['Upload up to 100 artworks', 'Artwork visibility', 'Payment receipts', 'Bandwidth Visibility', 'Artwork Analysis', 'Support Commissions', 'Advanced Analytics'], ctaStyle: 'border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white' },
  { name: 'Platinum', price: '₹125', period: 'Per Month', sub: '₹99 Per Year', color: 'bg-purple-600', features: ['Unlimited artworks', 'Artwork visibility', 'Payment receipts', 'Bandwidth Visibility', 'Artwork Analysis', 'Support Commissions', 'Advanced Analytics', 'Expert Consultation', 'Support from artist'], ctaStyle: 'border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white' },
];

const SAMPLE_ARTWORKS = [
  { id: '1', title: 'Monotype of Blank Landscapes, G1', code: 'HF-428854', price: 2500, status: 'Active' },
  { id: '2', title: 'Monotype of Blank Landscapes, G2', code: 'HF-428855', price: 2500, status: 'Draft' },
  { id: '3', title: 'R Peacock in Study, G1', code: 'HF-428856', price: 4995, status: 'Active' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
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

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
        }),
      });
      if (res.ok) setSaveMsg('Profile saved!');
      else setSaveMsg('Failed to save');
    } catch {
      setSaveMsg('Error saving profile');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome {user?.name || 'User'} Dashboard
        </h1>
        <nav className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
          <Link href="/" className="hover:text-[#e63329]">Home</Link>
          <span>/</span>
          <span className="text-gray-600">Dashboard</span>
          <span>/</span>
          <span className="text-gray-600 capitalize">{activeSection}</span>
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
                  {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{user.role} · {user.membershipTier}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-0.5">
            {NAV_ITEMS.filter((item) => !item.artistOnly || user?.role === 'artist').map(({ id, label, icon: Icon }) => (
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
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 border-l-2 border-transparent transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main>
          {/* Profile */}
          {activeSection === 'profile' && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-6">Profile Settings</h2>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-[#e63329] rounded-sm flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {user?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col gap-2">
                  <button className="btn-outline-red text-xs px-4 py-2 flex items-center gap-2">
                    <Upload size={13} /> Change Picture
                  </button>
                </div>
              </div>

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
                      value={profileData[name as keyof typeof profileData]}
                      onChange={handleProfileChange}
                      className="input-field"
                    />
                  </div>
                ))}
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
                  <p className={`text-xs px-3 py-2 rounded ${saveMsg.includes('saved') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {saveMsg}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button className="btn-secondary px-8">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary px-8 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Artworks */}
          {activeSection === 'artworks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900">Manage Artworks</h2>
                {user?.role === 'artist' && (
                  <Link
                    href="/dashboard/upload"
                    className="btn-primary flex items-center gap-2 text-xs"
                  >
                    <Plus size={14} /> Add Artwork
                  </Link>
                )}
              </div>

              <div className="border border-gray-100">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <span>Select</span>
                  <span>Artwork</span>
                  <span>Price</span>
                  <span>Action</span>
                </div>
                {SAMPLE_ARTWORKS.map((artwork) => (
                  <div key={artwork.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <input type="checkbox" className="accent-[#e63329]" />
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-100 flex items-center justify-center text-xl">🎨</div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 line-clamp-1">{artwork.title}</p>
                        <p className="text-[10px] text-gray-400">Code: {artwork.code}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 font-medium ${artwork.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {artwork.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">₹{artwork.price.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 hover:text-[#e63329] transition-colors" aria-label="Edit"><Edit3 size={14} /></button>
                      <button className="p-1.5 hover:text-red-500 transition-colors" aria-label="Delete"><Trash2 size={14} /></button>
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
                No orders yet. <Link href="/art-gallery" className="text-[#e63329] hover:underline">Browse artwork</Link> or wait for sales to come in.
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
              <p className="text-xs text-gray-500 mb-8">
                Current plan: <strong className="capitalize">{user?.membershipTier || 'Free'}</strong>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan) => {
                  const isCurrent = plan.name.toLowerCase() === (user?.membershipTier || 'free');
                  return (
                    <div key={plan.name} className={`border p-5 relative ${isCurrent ? 'border-[#e63329] ring-1 ring-red-100' : 'border-gray-200'}`}>
                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[9px] font-bold px-2.5 py-0.5 tracking-wider">
                          {plan.badge}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-full ${plan.color} flex items-center justify-center mb-3`}>
                        <Star size={16} className="text-white fill-white" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{plan.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{plan.price}</p>
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
                        {isCurrent ? 'Current Plan' : 'Subscribe'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Sales (for artists) */}
          {activeSection === 'sales' && (
            <SellerOrders artistId={user?.id || ''} />
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
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
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
