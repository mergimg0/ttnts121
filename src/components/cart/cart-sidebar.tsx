"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, X, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-provider";
import { formatPrice, getDayName } from "@/lib/booking-utils";

export function CartButton() {
  const { itemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 px-2 py-2 text-navy hover:text-navy-deep transition-colors"
        title="Shopping Cart"
      >
        <ShoppingCart className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
        <span className="hidden xl:inline text-sm font-semibold">Cart</span>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white text-xs font-bold">
            {itemCount}
          </span>
        )}
      </button>

      <CartSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, clearCart, getTotal } = useCart();

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-xl overflow-hidden"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-black uppercase tracking-wide">
                  Your Cart
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingCart className="h-12 w-12 text-neutral-300 mb-4" />
                    <p className="text-neutral-600 font-medium">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Browse sessions to add them to your cart
                    </p>
                    <Button asChild className="mt-6">
                      <Link href="/sessions" onClick={onClose}>
                        Browse Sessions
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.sessionId}
                        className="border border-neutral-200 p-4"
                      >
                        <div className="flex justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-black">
                              {item.sessionName}
                            </h3>
                            <p className="text-sm text-neutral-600 mt-1">
                              {item.programName}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {getDayName(item.dayOfWeek)} • {item.startTime} -{" "}
                              {item.endTime}
                            </p>
                            <p className="text-sm text-neutral-500">
                              Ages {item.ageMin}-{item.ageMax}
                            </p>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <span className="font-bold">
                              {formatPrice(item.price)}
                            </span>
                            <button
                              onClick={() => removeItem(item.sessionId)}
                              className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {items.length > 1 && (
                      <button
                        onClick={clearCart}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Clear all items
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-neutral-200 p-6 space-y-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                  <Button asChild className="w-full" size="lg">
                    <Link href="/checkout" onClick={onClose}>
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-neutral-500">
                    You&apos;ll enter details at checkout
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
