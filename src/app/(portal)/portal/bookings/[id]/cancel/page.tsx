"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface CancelPreview {
  bookingId: string;
  sessionName: string;
  sessionDate: string;
  originalAmount: number;
  refundAmount: number;
  refundPercentage: number;
  daysUntilSession: number;
  explanation: string;
  policy: {
    name: string;
    rules: Array<{
      daysBeforeSession: number;
      refundPercentage: number;
    }>;
  };
}

interface CancelPageProps {
  params: Promise<{ id: string }>;
}

export default function CancelBookingPage({ params }: CancelPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [preview, setPreview] = useState<CancelPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [canCancel, setCanCancel] = useState(false);

  useEffect(() => {
    async function fetchCancelPreview() {
      if (!firebaseUser || !id) return;

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/portal/bookings/${id}/cancel`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.canCancel) {
          setPreview(data.data);
          setCanCancel(true);
        } else {
          setCanCancel(false);
          setError(data.error || "This booking cannot be cancelled");
        }
      } catch (err) {
        console.error("Error fetching cancel preview:", err);
        setError("Failed to load cancellation details");
      } finally {
        setLoading(false);
      }
    }

    fetchCancelPreview();
  }, [firebaseUser, id]);

  const handleCancel = async () => {
    if (!firebaseUser || !id) return;

    setCancelling(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/portal/bookings/${id}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        setCancelled(true);
      } else {
        setError(data.error || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(pence / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
            <p className="text-neutral-500">Loading cancellation details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Booking Cancelled
            </h1>
            <p className="text-neutral-600 mb-6">
              Your booking has been successfully cancelled.
              {preview && preview.refundAmount > 0 && (
                <span className="block mt-2">
                  A refund of {formatCurrency(preview.refundAmount)} will be processed
                  to your original payment method within 5-10 business days.
                </span>
              )}
            </p>
            <p className="text-sm text-neutral-500 mb-8">
              A confirmation email has been sent to your email address.
            </p>
            <Link
              href="/portal/bookings"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Back to My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!canCancel || error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/portal/bookings/${id}`}
          className="inline-flex items-center text-sm text-neutral-600 hover:text-black mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Booking
        </Link>

        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Cannot Cancel Booking
            </h1>
            <p className="text-neutral-600 mb-6">
              {error || "This booking cannot be cancelled at this time."}
            </p>
            <Link
              href={`/portal/bookings/${id}`}
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Back to Booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/portal/bookings/${id}`}
        className="inline-flex items-center text-sm text-neutral-600 hover:text-black mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Booking
      </Link>

      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Cancel Booking</h1>
              <p className="text-sm text-neutral-600">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Booking Details */}
          {preview && (
            <div className="bg-neutral-50 rounded-lg p-4">
              <h3 className="font-medium text-neutral-900 mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-neutral-500">Session:</span>{" "}
                  <span className="font-medium">{preview.sessionName}</span>
                </p>
                <p>
                  <span className="text-neutral-500">Date:</span>{" "}
                  <span className="font-medium">{formatDate(preview.sessionDate)}</span>
                </p>
                <p>
                  <span className="text-neutral-500">Days until session:</span>{" "}
                  <span className="font-medium">{preview.daysUntilSession} days</span>
                </p>
              </div>
            </div>
          )}

          {/* Refund Information */}
          {preview && (
            <div className={`rounded-lg p-4 ${
              preview.refundPercentage === 100
                ? "bg-green-50 border border-green-200"
                : preview.refundPercentage > 0
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-red-50 border border-red-200"
            }`}>
              <h3 className="font-medium text-neutral-900 mb-3">Refund Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Original Amount</span>
                  <span className="font-medium">{formatCurrency(preview.originalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Refund Percentage</span>
                  <span className="font-bold text-lg">{preview.refundPercentage}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                  <span className="text-neutral-600">You will receive</span>
                  <span className="font-bold text-lg text-green-700">
                    {formatCurrency(preview.refundAmount)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mt-3">{preview.explanation}</p>
            </div>
          )}

          {/* Refund Policy */}
          {preview && (
            <div className="border border-neutral-200 rounded-lg p-4">
              <h3 className="font-medium text-neutral-900 mb-3">
                {preview.policy.name}
              </h3>
              <div className="space-y-1 text-sm">
                {preview.policy.rules
                  .sort((a, b) => b.daysBeforeSession - a.daysBeforeSession)
                  .map((rule, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between py-1 ${
                        preview.daysUntilSession >= rule.daysBeforeSession &&
                        (idx === 0 || preview.daysUntilSession < preview.policy.rules[idx - 1]?.daysBeforeSession)
                          ? "font-medium text-black bg-neutral-100 -mx-2 px-2 rounded"
                          : "text-neutral-500"
                      }`}
                    >
                      <span>
                        {rule.daysBeforeSession}+ days before
                      </span>
                      <span>{rule.refundPercentage}% refund</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-neutral-700 mb-2">
              Reason for cancellation (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              placeholder="Let us know why you're cancelling..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Link
              href={`/portal/bookings/${id}`}
              className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors text-center"
            >
              Keep Booking
            </Link>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Booking"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
