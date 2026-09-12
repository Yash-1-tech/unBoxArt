'use client';

import { createContext, useContext, useState, useCallback } from 'react';

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
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (artworkId: string) => boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  count: 0,
  subtotal: 0,
  shipping: 0,
  total: 0,
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  isInCart: () => false,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'quantity'>) => {
    setItems((prev) => {
      const exists = prev.find(
        (i) => i.artworkId === item.artworkId && i.type === item.type
      );
      if (exists) return prev; // already in cart
      const id = `${item.artworkId}-${item.type}-${Date.now()}`;
      return [...prev, { ...item, id, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (artworkId: string) => items.some((i) => i.artworkId === artworkId),
    [items]
  );

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = items.reduce((sum, i) => sum + i.shippingCost, 0);
  const total = subtotal + shipping;
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, shipping, total, addItem, removeItem, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
