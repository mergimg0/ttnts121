"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import {
  validateCheckoutForm,
  getFieldError,
  ValidationError,
} from "@/lib/validation";

interface BookingFormData {
  childFirstName: string;
  childLastName: string;
  childDOB: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  medicalConditions: string;
  marketingConsent: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, getTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    childFirstName: "",
    childLastName: "",
    childDOB: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    medicalConditions: "",
    marketingConsent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);

    // Client-side validation
    const validation = validateCheckoutForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError("Please fix the errors below");
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);

    try {
      // Create checkout session with Stripe
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            sessionId: item.sessionId,
            price: item.price,
            name: item.sessionName,
          })),
          customerDetails: formData,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Handle specific error types
        if (data.code === "SESSION_FULL") {
          setError(`Sorry, "${data.sessionName}" is now full. Please remove it from your cart and try a different session.`);
        } else if (data.code === "SESSION_NOT_FOUND") {
          setError("One or more sessions are no longer available. Please refresh and try again.");
        } else if (data.code === "PRICE_MISMATCH") {
          setError("Prices have changed since you added items to your cart. Please refresh the page.");
        } else {
          setError(data.error || "Failed to create checkout session. Please try again.");
        }
      }
    } catch (err) {
      // Network or unexpected errors
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again or contact us if the problem persists.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-neutral-300" />
          <h1 className="mt-6 text-2xl font-black uppercase tracking-wide text-black">
            Your cart is empty
          </h1>
          <p className="mt-2 text-neutral-600">
            Browse our sessions to find the perfect fit
          </p>
          <Button asChild className="mt-6">
            <Link href="/sessions">Browse Sessions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="bg-black py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/sessions"
              className="flex h-10 w-10 items-center justify-center border border-neutral-700 text-white hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
                Checkout
              </h1>
              <p className="text-neutral-400">
                Complete your booking in just a few steps
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 text-red-500">⚠️</div>
                    <div className="flex-1">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setError(null)}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Dismiss
                        </button>
                        <Link
                          href="/sessions"
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Browse other sessions
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Player Details */}
              <div className="border border-neutral-200 bg-white p-6">
                <h2 className="font-bold uppercase tracking-wide text-black mb-4">
                  Player Details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div data-error={!!getFieldError(fieldErrors, "childFirstName")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      First Name *
                    </label>
                    <Input
                      value={formData.childFirstName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          childFirstName: e.target.value,
                        })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "childFirstName") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "childFirstName") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "childFirstName")}</p>
                    )}
                  </div>
                  <div data-error={!!getFieldError(fieldErrors, "childLastName")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Last Name *
                    </label>
                    <Input
                      value={formData.childLastName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          childLastName: e.target.value,
                        })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "childLastName") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "childLastName") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "childLastName")}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2" data-error={!!getFieldError(fieldErrors, "childDOB")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Date of Birth *
                    </label>
                    <Input
                      type="date"
                      value={formData.childDOB}
                      onChange={(e) =>
                        setFormData({ ...formData, childDOB: e.target.value })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "childDOB") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "childDOB") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "childDOB")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Parent Details */}
              <div className="border border-neutral-200 bg-white p-6">
                <h2 className="font-bold uppercase tracking-wide text-black mb-4">
                  Parent/Guardian Details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div data-error={!!getFieldError(fieldErrors, "parentFirstName")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      First Name *
                    </label>
                    <Input
                      value={formData.parentFirstName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentFirstName: e.target.value,
                        })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "parentFirstName") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "parentFirstName") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentFirstName")}</p>
                    )}
                  </div>
                  <div data-error={!!getFieldError(fieldErrors, "parentLastName")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Last Name *
                    </label>
                    <Input
                      value={formData.parentLastName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentLastName: e.target.value,
                        })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "parentLastName") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "parentLastName") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentLastName")}</p>
                    )}
                  </div>
                  <div data-error={!!getFieldError(fieldErrors, "parentEmail")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, parentEmail: e.target.value })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "parentEmail") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "parentEmail") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentEmail")}</p>
                    )}
                  </div>
                  <div data-error={!!getFieldError(fieldErrors, "parentPhone")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Phone *
                    </label>
                    <Input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, parentPhone: e.target.value })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "parentPhone") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "parentPhone") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentPhone")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border border-neutral-200 bg-white p-6">
                <h2 className="font-bold uppercase tracking-wide text-black mb-4">
                  Emergency Contact
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div data-error={!!getFieldError(fieldErrors, "emergencyContactName")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Contact Name *
                    </label>
                    <Input
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactName: e.target.value,
                        })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "emergencyContactName") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "emergencyContactName") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "emergencyContactName")}</p>
                    )}
                  </div>
                  <div data-error={!!getFieldError(fieldErrors, "emergencyContactPhone")}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Contact Phone *
                    </label>
                    <Input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactPhone: e.target.value,
                        })
                      }
                      className={`rounded-none ${getFieldError(fieldErrors, "emergencyContactPhone") ? "border-red-500 bg-red-50" : ""}`}
                    />
                    {getFieldError(fieldErrors, "emergencyContactPhone") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "emergencyContactPhone")}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Relationship
                    </label>
                    <Input
                      value={formData.emergencyContactRelationship}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactRelationship: e.target.value,
                        })
                      }
                      placeholder="e.g., Grandparent, Aunt, Family Friend"
                      className="rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border border-neutral-200 bg-white p-6">
                <h2 className="font-bold uppercase tracking-wide text-black mb-4">
                  Medical Information
                </h2>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Medical Conditions / Allergies / Special Requirements
                  </label>
                  <Textarea
                    value={formData.medicalConditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medicalConditions: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Please let us know about any medical conditions, allergies, or special requirements we should be aware of"
                    className="rounded-none"
                  />
                </div>
              </div>

              {/* Marketing Consent */}
              <div className="border border-neutral-200 bg-white p-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={formData.marketingConsent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        marketingConsent: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4"
                  />
                  <label htmlFor="marketing" className="text-sm text-neutral-600">
                    I would like to receive news, updates, and special offers
                    from Take The Next Step 121 Coaching via email. You can
                    unsubscribe at any time.
                  </label>
                </div>
              </div>

              {/* Submit Button - Mobile */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay {formatPrice(getTotal())}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 p-6">
                <h2 className="font-bold uppercase tracking-wide text-black">
                  Order Summary
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {items.map((item) => (
                  <motion.div
                    key={item.sessionId}
                    layout
                    className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-black">
                        {item.sessionName}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {item.programName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getDayName(item.dayOfWeek)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.startTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <span className="font-bold">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        onClick={() => removeItem(item.sessionId)}
                        className="p-1 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-neutral-200 p-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>

                {/* Submit Button - Desktop */}
                <div className="hidden lg:block mt-4">
                  <Button
                    type="submit"
                    form="checkout-form"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay {formatPrice(getTotal())}
                      </>
                    )}
                  </Button>
                </div>

                <p className="mt-4 text-xs text-center text-neutral-500">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Cart Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg lg:hidden z-40">
        <button
          onClick={() => setShowMobileCart(!showMobileCart)}
          className="w-full flex items-center justify-between p-4 bg-neutral-50"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-bold">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{formatPrice(getTotal())}</span>
            {showMobileCart ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {showMobileCart && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-neutral-200"
            >
              <div className="max-h-[40vh] overflow-y-auto p-4 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.sessionId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.sessionName}</p>
                      <p className="text-xs text-neutral-500">
                        {getDayName(item.dayOfWeek)} {item.startTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatPrice(item.price)}</span>
                      <button
                        onClick={() => removeItem(item.sessionId)}
                        className="p-1 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer for mobile sticky cart */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
