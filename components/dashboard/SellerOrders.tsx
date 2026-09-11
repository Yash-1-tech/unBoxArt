'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, Clock, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface OrderItem {
  artwork: {
    _id: string;
    title: string;
    images: string[];
    code: string;
  };
  type: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  buyer: { name: string; email: string };
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
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

export default function SellerOrders({ artistId }: { artistId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!artistId) return;
    fetch(`/api/orders/seller?artistId=${artistId}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [artistId]);

  const updateOrderStatus = async (orderId: string, updates: Record<string, string>) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, ...updated } : o))
      );
    } catch {
      setError('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#e63329] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm py-8">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-gray-900">My Sales</h2>
        <span className="text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200">
          <Package size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">No orders yet.</p>
          <p className="text-xs text-gray-400 mt-1">When buyers purchase your artwork, orders will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border border-gray-100 overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700">{order.orderNumber}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {order.orderStatus}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PAYMENT_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Buyer Info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Buyer</p>
                    <p className="text-sm font-medium text-gray-900">{order.buyer?.name}</p>
                    <p className="text-xs text-gray-400">{order.buyer?.email}</p>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ship To</p>
                    <p className="text-sm text-gray-700">{order.shippingAddress?.fullName}</p>
                    <p className="text-xs text-gray-500">{order.shippingAddress?.addressLine1}</p>
                    <p className="text-xs text-gray-500">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                    </p>
                    <p className="text-xs text-gray-500">{order.shippingAddress?.phone}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</p>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex gap-3 mb-2">
                      <div className="w-12 h-12 bg-gray-100 flex-shrink-0 overflow-hidden">
                        {item.artwork?.images?.[0]
                          ? <img src={item.artwork.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🎨</div>
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.artwork?.title}</p>
                        <p className="text-[10px] text-gray-400">{item.artwork?.code} · {item.type.replace('_', ' ')} × {item.quantity}</p>
                        <p className="text-xs font-semibold text-gray-900 mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-50">
                    <span>Order Total</span>
                    <span>₹{order.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center gap-2">
                  {/* Status actions */}
                  {order.orderStatus === 'placed' || order.orderStatus === 'confirmed' ? (
                    <>
                      {order.orderStatus === 'placed' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, { orderStatus: 'confirmed' })}
                          disabled={updatingId === order._id}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-purple-300 text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={13} /> Confirm Order
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tracking number"
                          value={trackingInputs[order._id] || order.trackingNumber || ''}
                          onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order._id]: e.target.value }))}
                          className="text-xs border border-gray-200 px-3 py-2 outline-none focus:border-[#e63329] w-40"
                        />
                        <button
                          onClick={() => updateOrderStatus(order._id, {
                            orderStatus: 'shipped',
                            trackingNumber: trackingInputs[order._id] || '',
                          })}
                          disabled={updatingId === order._id}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          <Truck size={13} /> Mark Shipped
                        </button>
                      </div>
                    </>
                  ) : order.orderStatus === 'shipped' ? (
                    <button
                      onClick={() => updateOrderStatus(order._id, { orderStatus: 'delivered' })}
                      disabled={updatingId === order._id}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={13} /> Mark Delivered
                    </button>
                  ) : null}

                  {order.trackingNumber && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Truck size={12} /> {order.trackingNumber}
                    </span>
                  )}

                  {updatingId === order._id && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> Updating...
                    </span>
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
