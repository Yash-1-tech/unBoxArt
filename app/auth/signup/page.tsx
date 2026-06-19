'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'buyer' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess('Account created! Redirecting...');
      setTimeout(() => router.push('/auth/signin'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
      <div className="bg-white w-full max-w-md p-8 shadow-sm">
        <div className="text-center mb-7">
          <Link href="/" className="inline-block mb-4">
            <span className="font-playfair text-2xl font-bold">unbox<span className="text-[#e63329]">arts</span></span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Create Your Account</h2>
          <p className="text-xs text-gray-400">Join thousands of artists and art lovers</p>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}
        {success && <p className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" type="text" placeholder="Full Name" value={form.name} onChange={handleChange} className="input-field" required />
          <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} className="input-field" required />
          <input name="phone" type="tel" placeholder="Mobile Number" value={form.phone} onChange={handleChange} className="input-field" />
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 chars)" value={form.password} onChange={handleChange} className="input-field pr-10" required minLength={8} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">I am joining as</label>
            <select name="role" value={form.role} onChange={handleChange} className="input-field">
              <option value="buyer">Buyer — I want to collect art</option>
              <option value="artist">Artist — I want to sell my art</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-60">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Already have an Account?{' '}
          <Link href="/auth/signin" className="text-[#e63329] font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
