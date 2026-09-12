'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayAvailable, setRazorpayAvailable] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, fullName: user?.name || prev.fullName }));
  }, [user]);

  useEffect(() => {
    // Check if Razorpay keys are configured
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      setRazorpayAvailable(true);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!form.fullName || !form.phone || !form.addressLine1 ||
        !form.city || !form.state || !form.pincode) {
      setError('Please fill in all required fields');
      return false;
    }
    if (form.pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  // Create MongoDB order record
  const createMongoOrder = async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer: user!.id,
        items: items.map((item) => ({
          artwork: item.artworkId,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
        },
        paymentMethod,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create order');
    return data;
  };

  // Handle Razorpay payment flow
  const handleRazorpayPayment = async (mongoOrder: any) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error('Failed to load Razorpay. Check your connection.');

    // Create Razorpay order server-side
    const rzpOrderRes = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total, receipt: mongoOrder._id }),
    });
    const rzpOrderData = await rzpOrderRes.json();
    if (!rzpOrderRes.ok) throw new Error(rzpOrderData.error || 'Payment setup failed');

    // Open Razorpay modal
    return new Promise<void>((resolve, reject) => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name: 'Unboxarts',
        description: `Order ${mongoOrder.orderNumber}`,
        order_id: rzpOrderData.orderId,
        prefill: {
          name: form.fullName,
          contact: form.phone,
          email: user?.email || '',
        },
        theme: { color: '#e63329' },
        handler: async (response: any) => {
          try {
            // Verify payment signature
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: mongoOrder._id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  };

  // Handle COD / manual payment
  const handleManualPayment = async (mongoOrder: any) => {
    await fetch(`/api/orders/${mongoOrder._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'pending', orderStatus: 'placed' }),
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      router.push('/auth/signin?from=/checkout');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Step 1: Create order in MongoDB
      const mongoOrder = await createMongoOrder();

      // Step 2: Handle payment
      if (paymentMethod === 'razorpay' && razorpayAvailable) {
        await handleRazorpayPayment(mongoOrder);
      } else {
        await handleManualPayment(mongoOrder);
      }

      // Step 3: Success
      clearCart();
      router.push('/orders/success');
    } catch (err: any) {
      if (err.message === 'Payment cancelled') {
        setError('Payment was cancelled. Your order was not placed.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link href="/art-gallery" className="btn-primary">Browse Gallery</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 mb-6 rounded">
          {error}
        </p>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

          {/* Left */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="border border-gray-100 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-5">
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="input-field" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX" className="input-field" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Address Line 1 *</label>
                  <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="House No, Street, Area" className="input-field" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Address Line 2</label>
                  <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Landmark (optional)" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">City *</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State *</label>
                  <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pincode *</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit pincode" className="input-field" maxLength={6} required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Country</label>
                  <select name="country" value={form.country} onChange={handleChange} className="input-field">
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Australia">Australia</option>
                    <option value="Canada">Canada</option>
                    <option value="Singapore">Singapore</option>
                    <option value="UAE">UAE</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border border-gray-100 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-5">
                Payment Method
              </h2>
              <div className="space-y-3">
                {razorpayAvailable && (
                  <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'border-[#e63329] bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-[#e63329]" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Pay Online — Razorpay</p>
                      <p className="text-xs text-gray-400">UPI, Cards, Net Banking, Wallets</p>
                    </div>
                    <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 font-medium">RECOMMENDED</span>
                  </label>
                )}
                {[
                  { value: 'upi', label: 'UPI (manual)', desc: 'Pay via UPI and share screenshot' },
                  { value: 'netbanking', label: 'Net Banking / NEFT / RTGS', desc: 'Bank transfer — details shared after order' },
                  { value: 'cod', label: 'Cash on Delivery', desc: 'Available for orders below ₹50,000' },
                ].map((method) => (
                  <label key={method.value} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${paymentMethod === method.value ? 'border-[#e63329] bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="payment" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} className="accent-[#e63329]" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {!razorpayAvailable && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 mt-4 rounded">
                  Online payments not configured yet. Add <code>NEXT_PUBLIC_RAZORPAY_KEY_ID</code> to .env.local to enable Razorpay.
                </p>
              )}
            </div>
          </div>

          {/* Right — Summary */}
          <div className="self-start sticky top-24">
            <div className="border border-gray-100 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">🎨</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{item.type.replace('_', ' ')}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 flex-shrink-0">
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>₹{shipping.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2.5">
                  <span>Total</span>
                  <span className="text-lg text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  : paymentMethod === 'razorpay' && razorpayAvailable
                    ? `Pay ₹${total.toLocaleString('en-IN')}`
                    : `Place Order — ₹${total.toLocaleString('en-IN')}`
                }
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-3">
                <Shield size={12} /> SSL Secured — Your data is safe
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
