'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">
      <h1 className="font-playfair text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-6">
          <div className="border border-gray-100 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Full Name','Phone Number','Address Line 1','Address Line 2','City','State','Pincode','Country'].map(f => (
                <div key={f} className={f === 'Address Line 1' || f === 'Address Line 2' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs text-gray-500 mb-1">{f}</label>
                  <input type="text" placeholder={f} className="input-field" />
                </div>
              ))}
            </div>
          </div>
          <div className="border border-gray-100 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {['Credit / Debit Card','UPI','Net Banking','PayPal'].map(method => (
                <label key={method} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment" className="accent-[#e63329]" defaultChecked={method === 'UPI'} />
                  <span className="text-sm text-gray-700">{method}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="border border-gray-100 p-6 self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-5">Order Summary</h2>
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>₹1,64,999</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>₹100</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-3"><span>Total</span><span>₹1,65,099</span></div>
          </div>
          <button className="btn-primary w-full mb-3">Place Order</button>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield size={12} /> Secured by SSL encryption
          </div>
        </div>
      </div>
    </div>
  );
}
