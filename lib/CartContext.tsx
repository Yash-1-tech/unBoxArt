'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

import { useAuth } from '@/lib/AuthContext';

export interface CartItem {
  id: string;
  artworkId: string;
  title: string;
  artistName: string;
  price: number;
  shippingCost: number;
  image: string;
  type: 'original' | 'digital_print';
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  addItem: (
    item: Omit<CartItem, 'id' | 'quantity'>
  ) => Promise<{ success: boolean; error?: string }>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (artworkId: string) => boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  count: 0,
  subtotal: 0,
  shipping: 0,
  total: 0,
  addItem: async () => ({ success: false }),
  removeItem: async () => {},
  clearCart: async () => {},
  isInCart: () => false,
});

function transformCartItems(apiItems: any[]): CartItem[] {
  return apiItems
    .filter((item) => item.artwork)
    .map((item) => {
      const artwork = item.artwork;

      const price =
        item.type === 'digital_print'
          ? Number(artwork.digitalPrintPrice || 0)
          : Number(artwork.originalPrice || 0);

      return {
        id: `${artwork._id}-${item.type}`,
        artworkId: artwork._id,
        title: artwork.title,
        artistName: artwork.artist?.name || 'Unknown Artist',
        price,
        shippingCost:
          item.type === 'digital_print'
            ? 0
            : Number(artwork.shippingCost || 0),
        image: artwork.images?.[0] || '',
        type: item.type,
        quantity: item.quantity,
      };
    });
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!user || user.role !== 'buyer') {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/cart');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load cart');
      }

      setItems(transformCartItems(data.cart?.items || []));
    } catch (error) {
      console.error('Failed to load cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(
    async (item: Omit<CartItem, 'id' | 'quantity'>) => {
      if (!user) {
        return {
          success: false,
          error: 'You must be logged in to add items to your cart.',
        };
      }

      if (user.role !== 'buyer') {
        return {
          success: false,
          error: 'Artist accounts cannot purchase artwork.',
        };
      }

      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artworkId: item.artworkId,
            type: item.type,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: data.error || 'Failed to add item to cart.',
          };
        }

        setItems(transformCartItems(data.cart?.items || []));

        return {
          success: true,
        };
      } catch (error) {
        console.error('Failed to add item to cart:', error);

        return {
          success: false,
          error: 'Something went wrong. Please try again.',
        };
      }
    },
    [user]
  );

  const removeItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);

      if (!item) return;

      const res = await fetch('/api/cart/item', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId: item.artworkId,
          type: item.type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove item');
      }

      setItems(transformCartItems(data.cart?.items || []));
    },
    [items]
  );

  const clearCart = useCallback(async () => {
    const res = await fetch('/api/cart/clear', {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to clear cart');
    }

    setItems([]);
  }, []);

  const isInCart = useCallback(
    (artworkId: string) =>
      items.some((item) => item.artworkId === artworkId),
    [items]
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shipping = items.reduce(
    (sum, item) => sum + item.shippingCost * item.quantity,
    0
  );

  const total = subtotal + shipping;

  const count = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        shipping,
        total,
        addItem,
        removeItem,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}