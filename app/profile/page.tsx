'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Upload, Loader2, Instagram, Youtube, Globe } from 'lucide-react';

export default function EditProfilePage() {
  const { user, refetch } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    bio: '',
    location: '',
    instagram: '',
    youtube: '',
    website: '',
    facebook: '',
    twitter: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin?from=/profile');
      return;
    }
    // Load current profile from API
    fetch(`/api/users/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const u = data.user;
        if (u) {
          setForm({
            name: u.name || '',
            bio: u.bio || '',
            location: u.location || '',
            instagram: u.socialLinks?.instagram || '',
            youtube: u.socialLinks?.youtube || '',
            website: u.socialLinks?.website || '',
            facebook: u.socialLinks?.facebook || '',
            twitter: u.socialLinks?.twitter || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          location: form.location,
          socialLinks: {
            instagram: form.instagram,
            youtube: form.youtube,
            website: form.website,
            facebook: form.facebook,
            twitter: form.twitter,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      await refetch(); // Update navbar name
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'artist'
              ? 'Your profile is visible to buyers on your artist page'
              : 'Update your account information'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Dashboard
        </button>
      </div>

      {success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 px-4 py-3 mb-6 rounded">
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 mb-6 rounded">
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#e63329] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {form.name ? form.name[0].toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Profile Picture</p>
            <p className="text-xs text-gray-400 mb-2">
              Profile picture upload via Cloudinary coming soon
            </p>
            <button
              type="button"
              className="text-xs text-[#e63329] border border-[#e63329] px-3 py-1.5 hover:bg-red-50 transition-colors flex items-center gap-1.5 opacity-50 cursor-not-allowed"
              disabled
            >
              <Upload size={12} /> Change Picture
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
            Basic Information
          </h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              name="name" value={form.name} onChange={handleChange}
              className="input-field" required placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Location
            </label>
            <input
              name="location" value={form.location} onChange={handleChange}
              className="input-field" placeholder="e.g. Mumbai, India"
            />
          </div>
          {user?.role === 'artist' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Bio <span className="text-gray-400 normal-case font-normal">(shown on your artist page)</span>
              </label>
              <textarea
                name="bio" value={form.bio} onChange={handleChange}
                rows={5} placeholder="Tell buyers about your art, your inspiration, your process..."
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{form.bio.length}/1000 characters</p>
            </div>
          )}
        </div>

        {/* Social Links — artists only */}
        {user?.role === 'artist' && (
          <div className="border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
              Social Links
            </h2>
            {[
              { name: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourhandle' },
              { name: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
              { name: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
            ].map(({ name, label, icon: Icon, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {label}
                </label>
                <div className="flex items-center border border-gray-200 focus-within:border-[#e63329] transition-colors">
                  <div className="px-3 py-3 border-r border-gray-200 bg-gray-50">
                    <Icon size={15} className="text-gray-400" />
                  </div>
                  <input
                    name={name}
                    value={form[name as keyof typeof form]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-secondary px-8"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
