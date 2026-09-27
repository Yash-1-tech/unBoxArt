'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

import { useAuth } from '@/lib/AuthContext';

export type CartItemType = 'original' | 'digital_print';

export interface CartItem {
  id: string;
  artworkId: string;
  title: string;
  artistName: string;
  price: number;
  shippingCost: number;
  image: string;
  type: CartItemType;
  quantity: number;
}

interface ApiArtist {
  _id: string;
  name?: string;
  profileImage?: string;
}

interface ApiArtwork {
  _id: string;
  title?: string;
  originalPrice?: number;
  digitalPrintPrice?: number;
  shippingCost?: number;
  images?: string[];
  artist?: ApiArtist | null;
}

interface ApiCartItem {
  artwork: ApiArtwork | null;
  type: CartItemType;
  quantity: number;
}

interface ApiCart {
  _id?: string;
  user: string;
  items: ApiCartItem[];
}

interface CartApiResponse {
  cart?: ApiCart;
  error?: string;
  message?: string;
}

interface AddItemInput {
  artworkId: string;
  title: string;
  artistName: string;
  price: number;
  shippingCost: number;
  image: string;
  type: CartItemType;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  loading: boolean;
  removingItemId: string | null;
  subtotal: number;
  shipping: number;
  total: number;

  addItem: (
    item: AddItemInput
  ) => Promise<{ success: boolean; error?: string }>;

  removeItem: (id: string) => Promise<void>;

  updateQuantity: (
  id: string,
  quantity: number
  ) => Promise<void>;

  clearCart: () => Promise<void>;

  isInCart: (artworkId: string) => boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  count: 0,
  loading: false,
  removingItemId: null,
  subtotal: 0,
  shipping: 0,
  total: 0,

  addItem: async () => ({
    success: false,
  }),

  removeItem: async () => {},

  updateQuantity: async () => {},

  clearCart: async () => {},

  isInCart: () => false,
});

function transformCartItems(apiItems: ApiCartItem[]): CartItem[] {
  return apiItems
    .filter((item) => item.artwork && item.artwork._id)
    .map((item) => {
      const artwork = item.artwork!;

      const isDigitalPrint = item.type === 'digital_print';

      const price = isDigitalPrint
        ? Number(artwork.digitalPrintPrice ?? 0)
        : Number(artwork.originalPrice ?? 0);

      const shippingCost = isDigitalPrint
        ? 0
        : Number(artwork.shippingCost ?? 0);

      return {
        id: `${String(artwork._id)}-${item.type}`,

        artworkId: String(artwork._id),

        title: artwork.title ?? 'Untitled Artwork',

        artistName: artwork.artist?.name ?? 'Unknown Artist',

        price,

        shippingCost,

        image: artwork.images?.[0] ?? '',

        type: item.type,

        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    });
}

async function parseCartResponse(
  response: Response
): Promise<CartApiResponse> {
  try {
    return (await response.json()) as CartApiResponse;
  } catch {
    return {
      error: 'Invalid response from server.',
    };
  }
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [removingItemId, setRemovingItemId] =
  useState<string | null>(null);

  const loadCart = useCallback(async () => {
    if (!user || user.role !== 'buyer') {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/cart', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await parseCartResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to load cart.'
        );
      }

      setItems(
        transformCartItems(data.cart?.items ?? [])
      );
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
    async (item: AddItemInput) => {
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

      if (!item.artworkId) {
        return {
          success: false,
          error: 'Invalid artwork.',
        };
      }

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artworkId: item.artworkId,
            type: item.type,
          }),
        });

        const data = await parseCartResponse(response);

        if (!response.ok) {
          return {
            success: false,
            error:
              data.error ||
              'Failed to add item to cart.',
          };
        }

        setItems(
          transformCartItems(data.cart?.items ?? [])
        );

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
      const item = items.find(
        (cartItem) => cartItem.id === id
      );

      if (!item) {
        console.warn(
          `Cart item "${id}" was not found in local state.`
        );
        return;
      }

      if (!item.artworkId || !item.type) {
        console.error(
          'Cannot remove invalid cart item:',
          item
        );
        return;
      }
      
      setRemovingItemId(id);

      try {
        const response = await fetch('/api/cart/item', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artworkId: item.artworkId,
            type: item.type,
          }),
        });

        const data = await parseCartResponse(response);

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to remove item from cart.'
          );
        }

        setItems(
          transformCartItems(data.cart?.items ?? [])
        );
      } catch (error) {
        console.error(
          'Failed to remove cart item:',
          error
        );

        await loadCart();
      } finally {
        setRemovingItemId(null);
      }
    },
    [items, loadCart]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      const item = items.find(
        (cartItem) => cartItem.id === id
      );

      if (!item) {
        console.warn(
          `Cart item "${id}" was not found in local state.`
        );
        return;
      }

      if (!item.artworkId || !item.type) {
        console.error(
          'Cannot update invalid cart item:',
          item
        );
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return;
      }

      try {
        const response = await fetch('/api/cart/item', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artworkId: item.artworkId,
            type: item.type,
            quantity,
          }),
        });

        const data = await parseCartResponse(response);

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to update cart quantity.'
          );
        }

        setItems(
          transformCartItems(data.cart?.items ?? [])
        );
      } catch (error) {
        console.error(
          'Failed to update cart quantity:',
          error
        );

        await loadCart();
      }
    },
    [items, loadCart]
  );


  const clearCart = useCallback(async () => {
    try {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
      });

      const data = await parseCartResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to clear cart.'
        );
      }

      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);

      // Re-sync with the database if clearing failed.
      await loadCart();
    }
  }, [loadCart]);

  const isInCart = useCallback(
    (artworkId: string) => {
      return items.some(
        (item) => item.artworkId === artworkId
      );
    },
    [items]
  );

  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const shipping = items.reduce(
    (sum, item) =>
      sum + item.shippingCost * item.quantity,
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
        loading,
        removingItemId,
        subtotal,
        shipping,
        total,
        addItem,
        removeItem,
        updateQuantity,
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