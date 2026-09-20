'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function UploadArtworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', medium: '', subject: '', style: '',
    width: '', height: '', unit: 'in',
    originalPrice: '', digitalPrintPrice: '', shippingCost: '50', stock: '1',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 6));
  };

  const removeImage = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (images.length === 0) return setError('Please add at least one image');
    if (!form.title || !form.medium || !form.originalPrice) {
      return setError('Title, medium, and price are required');
    }
    if (!user) return setError('You must be logged in to upload artwork');
    if (!form.title || !form.medium || !form.subject || !form.originalPrice || !form.width || !form.height) {
      return setError('Title, medium, subject, price, width, and height are required');
    }
    if (Number(form.originalPrice) < 0) {
      return setError('Original price cannot be negative');
    }
    if (form.digitalPrintPrice && Number(form.digitalPrintPrice) < 0) {
      return setError('Digital print price cannot be negative');
    }
    if (Number(form.shippingCost) < 0) {
      return setError('Shipping cost cannot be negative');
    }

    setUploading(true);
    try {
      const formData = new FormData();

      images.forEach((img) => {
        formData.append('files', img.file);
      });

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(
          uploadData.error || 'Image upload failed'
        );
      }

      const imageUrls: string[] = uploadData.urls || [];

      if (imageUrls.length === 0) {
        throw new Error('Image upload returned no image URLs');
      }

      const artworkRes = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          medium: form.medium,
          subject: form.subject,
          style: form.style,
          dimensions: {
            width: Number(form.width) || 0,
            height: Number(form.height) || 0,
            unit: form.unit,
          },
          originalPrice: Number(form.originalPrice),
          digitalPrintPrice: form.digitalPrintPrice ? Number(form.digitalPrintPrice) : undefined,
          shippingCost: Number(form.shippingCost),
          stock: Number(form.stock),
          images: imageUrls,
          artist: user.id,  // ← automatically from session
        }),
      });

      const artworkData = await artworkRes.json();
      if (!artworkRes.ok) throw new Error(artworkData.error || 'Failed to save artwork');

      setSuccess('Artwork published successfully!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-gray-500 mb-4">You need to be logged in to upload artwork.</p>
        <a href="/auth/signin" className="btn-primary">Sign In</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-bold text-2xl text-gray-900">Upload Artwork</h1>
        <span className="text-xs text-gray-400">Uploading as <strong>{user.name}</strong></span>
      </div>
      <p className="text-sm text-gray-500 mb-8">Share your work with collectors worldwide. 0% commission, always.</p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 mb-6 rounded">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 px-4 py-3 mb-6 rounded">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Images <span className="text-gray-400 normal-case font-normal">(up to 6 — drag & drop or click)</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-[#e63329] transition-colors cursor-pointer p-10 flex flex-col items-center justify-center text-center"
          >
            <ImagePlus size={32} className="text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 group">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-[#e63329] text-white px-1">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Sunset Over the Backwaters" className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Tell the story behind this piece..." className="input-field resize-none" />
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Medium *</label>
            <select name="medium" value={form.medium} onChange={handleChange} className="input-field" required>
              <option value="">Select a medium</option>
              <option value="Acrylic">Acrylic</option>
              <option value="Oil">Oil</option>
              <option value="Watercolor">Watercolor</option>
              <option value="Pencil">Pencil</option>
              <option value="Digital">Digital</option>
              <option value="Mixed Media">Mixed Media</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Subject *</label>
            <select name="subject" value={form.subject} onChange={handleChange} className="input-field" required>
              <option value="">Select a subject</option>
              <option value="Abstract">Abstract</option>
              <option value="Landscape">Landscape</option>
              <option value="Portrait">Portrait</option>
              <option value="Still Life">Still Life</option>
              <option value="Wildlife">Wildlife</option>
              <option value="Religious">Religious</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Style</label>
            <select name="style" value={form.style} onChange={handleChange} className="input-field">
              <option value="">Select a style</option>
              <option value="Modern">Modern</option>
              <option value="Contemporary">Contemporary</option>
              <option value="Impressionist">Impressionist</option>
              <option value="Realist">Realist</option>
              <option value="Expressionist">Expressionist</option>
            </select>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Width *</label>
            <input name="width" type="number" min="0.1" step="0.1" value={form.width} onChange={handleChange} placeholder="36" className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Height *</label>
            <input name="height" type="number" min="0.1" step="0.1" value={form.height} onChange={handleChange} placeholder="36" className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Unit</label>
            <select name="unit" value={form.unit} onChange={handleChange} className="input-field">
              <option value="in">inches</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Original Price (₹) *</label>
            <input name="originalPrice" type="number" min="0" step="1" value={form.originalPrice} onChange={handleChange} placeholder="160000" className="input-field" required/>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Digital Print Price (₹)</label>
            <input name="digitalPrintPrice" type="number" min="0" step="1" value={form.digitalPrintPrice} onChange={handleChange} placeholder="4999" className="input-field" required/>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Shipping Cost (₹)</label>
            <input name="shippingCost" type="number" value={form.shippingCost} onChange={handleChange} className="input-field" />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" /> Publishing...</>
          ) : (
            <><Upload size={16} /> Publish Artwork</>
          )}
        </button>
      </form>
    </div>
  );
}
