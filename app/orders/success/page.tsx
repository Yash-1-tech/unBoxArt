'use client';

import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white max-w-md w-full p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Thank you for your purchase. Your order has been received and the artist has been notified.
          You'll receive a confirmation email shortly.
        </p>

        <div className="bg-gray-50 border border-gray-100 px-4 py-3 mb-8 flex items-center gap-3">
          <Package size={18} className="text-gray-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-gray-700">What happens next?</p>
            <p className="text-xs text-gray-500 mt-0.5">
              The artist will prepare your artwork and ship it within 3–5 business days.
              You'll get a tracking number by email once it's dispatched.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard?section=orders" className="btn-primary flex items-center justify-center gap-2">
            View My Orders <ArrowRight size={16} />
          </Link>
          <Link href="/art-gallery" className="btn-secondary flex items-center justify-center gap-2">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
