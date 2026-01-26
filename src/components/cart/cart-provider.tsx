"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartItem } from "@/types/booking";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "addedAt">) => void;
  removeItem: (sessionId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  itemCount: number;
  isInCart: (sessionId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ttnts-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out expired items (older than 24 hours)
        const now = Date.now();
        const validItems = parsed.filter(
          (item: CartItem) => now - new Date(item.addedAt).getTime() < 24 * 60 * 60 * 1000
        );
        setItems(validItems);
      } catch (e) {
        console.error("Error parsing cart:", e);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const addItem = (item: Omit<CartItem, "addedAt">) => {
    setItems((prev) => {
      // Check if already in cart
      if (prev.some((i) => i.sessionId === item.sessionId)) {
        return prev;
      }
      return [...prev, { ...item, addedAt: new Date() }];
    });
  };

  const removeItem = (sessionId: string) => {
    setItems((prev) => prev.filter((i) => i.sessionId !== sessionId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const isInCart = (sessionId: string) => {
    return items.some((i) => i.sessionId === sessionId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        getTotal,
        itemCount: items.length,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
