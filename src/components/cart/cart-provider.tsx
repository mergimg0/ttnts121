"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  trackCartForRecovery: (email: string, customerName?: string) => void;
  customerEmail: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ttnts-cart";
const CART_EMAIL_KEY = "ttnts-cart-email";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const storedEmail = localStorage.getItem(CART_EMAIL_KEY);

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

    if (storedEmail) {
      setCustomerEmail(storedEmail);
    }

    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // Track cart for abandonment recovery
  const trackCartOnServer = useCallback(async (email: string, cartItems: CartItem[], customerName?: string) => {
    if (!email || cartItems.length === 0) return;

    try {
      await fetch("/api/carts/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: cartItems,
          customerName,
        }),
      });
    } catch (error) {
      console.error("Error tracking cart:", error);
    }
  }, []);

  // Track cart when email is provided
  const trackCartForRecovery = useCallback((email: string, customerName?: string) => {
    if (!email || !email.includes("@")) return;

    setCustomerEmail(email);
    localStorage.setItem(CART_EMAIL_KEY, email);

    // Track on server if we have items
    if (items.length > 0) {
      trackCartOnServer(email, items, customerName);
    }
  }, [items, trackCartOnServer]);

  // Re-track cart when items change and we have an email
  useEffect(() => {
    if (isHydrated && customerEmail && items.length > 0) {
      // Debounce tracking to avoid too many requests
      const timer = setTimeout(() => {
        trackCartOnServer(customerEmail, items);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [items, customerEmail, isHydrated, trackCartOnServer]);

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
    // Clear email when cart is cleared (after checkout)
    setCustomerEmail(null);
    localStorage.removeItem(CART_EMAIL_KEY);
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
        trackCartForRecovery,
        customerEmail,
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
