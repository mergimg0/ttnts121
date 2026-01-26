"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle, Calendar, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get("booking_ref");
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const [cleared, setCleared] = useState(false);

  // Clear cart on success
  useEffect(() => {
    if (!cleared) {
      clearCart();
      setCleared(true);
    }
  }, [clearCart, cleared]);

  return (
    <div className="min-h-screen bg-neutral-50 py-12 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
          >
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>

          {/* Heading */}
          <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
            Booking Confirmed!
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Thank you for your booking. We&apos;re excited to see you!
          </p>

          {/* Booking Reference */}
          {bookingRef && (
            <div className="mt-8 border border-neutral-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Your Booking Reference
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-black">
                {bookingRef}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Please save this reference for your records
              </p>
            </div>
          )}

          {/* What's Next */}
          <div className="mt-8 border border-neutral-200 bg-white p-6 text-left">
            <h2 className="font-bold uppercase tracking-wide text-black mb-4">
              What Happens Next?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center bg-black text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-black">Confirmation Email</p>
                  <p className="text-sm text-neutral-600">
                    You&apos;ll receive a confirmation email with all the details
                    of your booking shortly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center bg-black text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-black">Session Reminder</p>
                  <p className="text-sm text-neutral-600">
                    We&apos;ll send you a reminder before your session with
                    everything you need to know.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center bg-black text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-black">Arrive & Play</p>
                  <p className="text-sm text-neutral-600">
                    Just turn up at the venue with your child ready to have fun
                    and learn!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 border border-neutral-200 bg-white p-6">
            <h2 className="font-bold uppercase tracking-wide text-black mb-4">
              Questions?
            </h2>
            <p className="text-neutral-600">
              If you have any questions about your booking, please don&apos;t
              hesitate to get in touch.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:info@takethenextstep121.co.uk"
                className="flex items-center gap-2 text-sm font-medium text-black hover:underline"
              >
                <Mail className="h-4 w-4" />
                info@takethenextstep121.co.uk
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild>
              <Link href="/sessions">
                <Calendar className="mr-2 h-4 w-4" />
                Book Another Session
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/">
                Return Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
