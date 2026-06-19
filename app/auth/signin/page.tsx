'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

function GoogleIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
}

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', remember: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push('/dashboard');
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
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In to Your Account</h2>
          <p className="text-xs text-gray-400">Enter your credentials to access your account</p>
        </div>

        {/* OAuth */}
        <div className="space-y-2.5 mb-5">
          <button className="w-full flex items-center justify-center gap-3 border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <GoogleIcon /> Sign In with Google
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3 mb-5">
          <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} className="input-field" required />
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={handleChange} className="input-field pr-10" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} className="accent-[#e63329]" /> Remember me
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-gray-500 hover:text-[#e63329] transition-colors">Forgot Password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-60">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Don't have an Account?{' '}
          <Link href="/auth/signup" className="text-[#e63329] font-medium hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
