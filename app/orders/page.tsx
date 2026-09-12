'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Loader2, ChevronRight, Truck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    artwork: { _id: string; title: string; images: string[]; code: string };
    type: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin?from=/orders');
      return;
    }
    fetch(`/api/orders?buyerId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <Package size={64} className="mx-auto text-gray-200 mb-6" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-400 mb-8 text-sm">
            When you purchase artwork, your orders will appear here
          </p>
          <Link href="/art-gallery" className="btn-primary">Browse Gallery</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700">{order.orderNumber}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {order.orderStatus}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PAYMENT_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="p-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3 mb-3 last:mb-0">
                    <div className="w-16 h-16 bg-gray-100 flex-shrink-0 overflow-hidden">
                      {item.artwork?.images?.[0] ? (
                        <img src={item.artwork.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🎨</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/artwork/${item.artwork?._id}`}
                        className="text-sm font-medium text-gray-800 hover:text-[#e63329] transition-colors line-clamp-1"
                      >
                        {item.artwork?.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {item.type.replace('_', ' ')} · Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Tracking */}
                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                    <Truck size={13} className="text-amber-500" />
                    <span>Tracking: <strong className="text-gray-700">{order.trackingNumber}</strong></span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/art-gallery`}
                    className="text-xs text-[#e63329] hover:underline"
                  >
                    Buy Again
                  </Link>
                  {order.orderStatus === 'delivered' && (
                    <span className="text-xs text-green-600 font-medium">✓ Delivered</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
