'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const SAMPLE_CART = [
  { id: '1', title: 'Om Mandala — Sacred Geometry', artistName: 'Dinkar Jadav', price: 160000, shippingCost: 50, type: 'original' },
  { id: '4', title: 'Mediterranean Dusk', artistName: 'David Farrés Calvo', price: 4999, shippingCost: 50, type: 'digital_print' },
];

export default function CartPage() {
  const [items, setItems] = useState(SAMPLE_CART);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const shipping = items.reduce((sum, i) => sum + i.shippingCost, 0);
  const total = subtotal + shipping;

  if (items.length === 0) return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
      <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
      <h1 className="font-playfair text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
      <p className="text-gray-500 mb-8">Discover original artwork from independent artists</p>
      <Link href="/art-gallery" className="btn-primary">Browse Gallery</Link>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">
      <h1 className="font-playfair text-2xl font-bold text-gray-900 mb-8">Shopping Cart ({items.length})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 border border-gray-100 p-4">
              <div className="w-24 h-24 bg-gray-100 flex-shrink-0 flex items-center justify-center text-3xl">🎨</div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.artistName}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{item.type.replace('_', ' ')}</p>
                <p className="text-sm font-bold text-gray-900 mt-2">₹{item.price.toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors self-start">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="border border-gray-100 p-6 self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-5">Order Summary</h2>
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>₹{shipping.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-3"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>
          <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight size={16} />
          </Link>
          <Link href="/art-gallery" className="block text-center text-xs text-gray-400 hover:text-[#e63329] mt-4 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
