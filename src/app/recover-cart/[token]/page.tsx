"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { CartRecoveryData } from "@/types/abandoned-cart";
import { formatPrice, getDayName } from "@/lib/booking-utils";

type RecoveryState = "loading" | "found" | "expired" | "error";

export default function RecoverCartPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const { addItem, clearCart } = useCart();

  const [state, setState] = useState<RecoveryState>("loading");
  const [cartData, setCartData] = useState<CartRecoveryData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("Invalid recovery link");
      return;
    }

    fetchCartData();
  }, [token]);

  const fetchCartData = async () => {
    try {
      const response = await fetch(`/api/carts/recover/${token}`);
      const data = await response.json();

      if (data.success && data.data) {
        setCartData(data.data);
        setState("found");
      } else if (response.status === 404) {
        setState("expired");
        setErrorMessage(data.error || "This recovery link has expired or is invalid");
      } else {
        setState("error");
        setErrorMessage(data.error || "Failed to recover cart");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setState("error");
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleRestoreCart = async () => {
    if (!cartData) return;

    setRestoring(true);

    try {
      // Clear existing cart and add recovered items
      clearCart();

      for (const item of cartData.items) {
        addItem({
          sessionId: item.sessionId,
          sessionName: item.sessionName,
          programId: item.programId,
          programName: item.programName,
          price: item.price,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          ageMin: item.ageMin,
          ageMax: item.ageMax,
        });
      }

      // Mark cart as recovered
      await fetch(`/api/carts/recover/${token}`, {
        method: "POST",
      });

      // Redirect to checkout
      router.push("/checkout");
    } catch (error) {
      console.error("Error restoring cart:", error);
      setErrorMessage("Failed to restore cart. Please try again.");
      setRestoring(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-neutral-400" />
          <p className="mt-4 text-neutral-600">Recovering your cart...</p>
        </div>
      </div>
    );
  }

  if (state === "expired" || state === "error") {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="mx-auto max-w-md px-4 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
          <h1 className="mt-6 text-2xl font-black uppercase tracking-wide text-black">
            {state === "expired" ? "Link Expired" : "Something Went Wrong"}
          </h1>
          <p className="mt-2 text-neutral-600">
            {errorMessage}
          </p>
          <div className="mt-8 space-y-3">
            <Button asChild className="w-full">
              <Link href="/sessions">Browse Sessions</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "found" && cartData) {
    const totalAmount = cartData.items.reduce((sum, item) => sum + item.price, 0);

    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-4 text-2xl font-black uppercase tracking-wide text-black">
              We Found Your Cart!
            </h1>
            <p className="mt-2 text-neutral-600">
              Welcome back! Your sessions are still available.
            </p>
          </div>

          {/* Cart Items */}
          <div className="bg-white border border-neutral-200 divide-y divide-neutral-100">
            <div className="p-4 bg-neutral-50">
              <h2 className="font-bold uppercase tracking-wide text-sm text-neutral-600">
                Your Sessions
              </h2>
            </div>
            {cartData.items.map((item) => (
              <div key={item.sessionId} className="p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-black">{item.sessionName}</h3>
                  <p className="text-sm text-neutral-500">{item.programName}</p>
                  <p className="text-sm text-neutral-500">
                    {getDayName(item.dayOfWeek)} at {item.startTime}
                  </p>
                </div>
                <span className="font-bold">{formatPrice(item.price)}</span>
              </div>
            ))}
            <div className="p-4 bg-neutral-50 flex justify-between items-center">
              <span className="font-bold uppercase tracking-wide text-sm">Total</span>
              <span className="text-xl font-bold">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Customer Details (if available) */}
          {cartData.customerDetails && (cartData.customerDetails.parentFirstName || cartData.customerDetails.childFirstName) && (
            <div className="mt-4 bg-white border border-neutral-200 p-4">
              <h3 className="font-bold uppercase tracking-wide text-sm text-neutral-600 mb-2">
                Saved Details
              </h3>
              {cartData.customerDetails.parentFirstName && (
                <p className="text-sm text-neutral-600">
                  Parent: {cartData.customerDetails.parentFirstName} {cartData.customerDetails.parentLastName || ""}
                </p>
              )}
              {cartData.customerDetails.childFirstName && (
                <p className="text-sm text-neutral-600">
                  Child: {cartData.customerDetails.childFirstName} {cartData.customerDetails.childLastName || ""}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleRestoreCart}
              disabled={restoring}
              className="w-full"
              size="lg"
            >
              {restoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Continue to Checkout
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/sessions">Browse More Sessions</Link>
            </Button>
          </div>

          {/* Expiry Notice */}
          <p className="mt-6 text-center text-sm text-neutral-500">
            This link expires on{" "}
            {new Date(cartData.expiresAt).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
