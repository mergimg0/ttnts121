"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { TransferSessionPicker } from "@/components/portal/transfer-session-picker";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransferPageProps {
  params: Promise<{ id: string }>;
}

interface TransferSession {
  id: string;
  name: string;
  description?: string;
  programId: string;
  programName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: Date;
  location: string;
  ageMin: number;
  ageMax: number;
  price: number;
  spotsLeft: number;
  priceDifference: number;
}

interface CurrentSession {
  id: string;
  name: string;
  price: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
}

interface BookingInfo {
  id: string;
  bookingRef: string;
  childFirstName: string;
  childLastName: string;
}

type Step = "select" | "confirm" | "processing" | "complete";

function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
}

export default function TransferPage({ params }: TransferPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuth();

  const [step, setStep] = useState<Step>("select");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [availableSessions, setAvailableSessions] = useState<TransferSession[]>([]);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [transferResult, setTransferResult] = useState<{
    action: string;
    message?: string;
    refundAmount?: number;
    checkoutUrl?: string;
  } | null>(null);

  // Check for cancelled checkout
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    async function fetchTransferOptions() {
      if (!firebaseUser || !id) return;

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/portal/bookings/${id}/transfer-options`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setCurrentSession(data.data.currentSession);
          setAvailableSessions(data.data.availableSessions);
          setBooking(data.data.booking);
        } else {
          setError(data.error || "Failed to load transfer options");
        }
      } catch (err) {
        console.error("Error fetching transfer options:", err);
        setError("Failed to load transfer options");
      } finally {
        setLoading(false);
      }
    }

    fetchTransferOptions();
  }, [firebaseUser, id]);

  const selectedSession = availableSessions.find((s) => s.id === selectedSessionId);

  async function handleConfirmTransfer() {
    if (!firebaseUser || !selectedSessionId) return;

    setProcessing(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/portal/bookings/${id}/transfer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newSessionId: selectedSessionId }),
      });

      const data = await response.json();

      if (data.success) {
        setTransferResult(data.data);

        if (data.data.action === "checkout_required") {
          // Redirect to Stripe checkout for upgrade payment
          window.location.href = data.data.checkoutUrl;
        } else {
          // Transfer complete (same price or downgrade)
          setStep("complete");
        }
      } else {
        setError(data.error || "Failed to process transfer");
        setStep("confirm");
      }
    } catch (err) {
      console.error("Error processing transfer:", err);
      setError("Failed to process transfer");
      setStep("confirm");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
            <p className="text-neutral-500">Loading transfer options...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentSession) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href={`/portal/bookings/${id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/portal/bookings/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to booking
      </Link>

      {/* Header */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Transfer Session</h1>
            <p className="text-sm text-neutral-500">
              {booking?.childFirstName} {booking?.childLastName} - {booking?.bookingRef}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              step === "select"
                ? "bg-sky-100 text-sky-700"
                : "bg-emerald-100 text-emerald-700"
            )}
          >
            {step !== "select" ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">
                1
              </span>
            )}
            Select
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-300" />
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              step === "confirm"
                ? "bg-sky-100 text-sky-700"
                : step === "complete"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-neutral-100 text-neutral-400"
            )}
          >
            {step === "complete" ? (
              <Check className="h-4 w-4" />
            ) : (
              <span
                className={cn(
                  "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                  step === "confirm"
                    ? "bg-sky-600 text-white"
                    : "bg-neutral-300 text-white"
                )}
              >
                2
              </span>
            )}
            Confirm
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-300" />
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              step === "complete"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-neutral-100 text-neutral-400"
            )}
          >
            {step === "complete" ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-neutral-300 text-white text-xs flex items-center justify-center">
                3
              </span>
            )}
            Done
          </div>
        </div>
      </div>

      {/* Cancelled Alert */}
      {cancelled && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Payment cancelled</p>
            <p className="text-sm text-amber-700">
              Your transfer was not completed. You can try again or select a different session.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Transfer failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        {step === "select" && currentSession && (
          <>
            <TransferSessionPicker
              currentSession={currentSession}
              availableSessions={availableSessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={setSelectedSessionId}
            />

            <div className="mt-6 pt-6 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setStep("confirm")}
                disabled={!selectedSessionId}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors",
                  selectedSessionId
                    ? "bg-neutral-900 text-white hover:bg-neutral-800"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                )}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {step === "confirm" && currentSession && selectedSession && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Confirm Transfer
              </h2>
              <p className="text-neutral-600">
                Please review the transfer details below before confirming.
              </p>
            </div>

            {/* Transfer Summary */}
            <div className="space-y-4">
              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-2">
                  From (Current Session)
                </p>
                <p className="font-medium text-neutral-900">{currentSession.name}</p>
                <p className="text-sm text-neutral-600">
                  {getDayName(currentSession.dayOfWeek)}, {currentSession.startTime} - {currentSession.endTime}
                </p>
                <p className="text-sm text-neutral-600">{currentSession.location}</p>
                <p className="text-sm font-medium text-neutral-700 mt-2">
                  {"\u00A3"}{(currentSession.price / 100).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-neutral-400" />
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                  To (New Session)
                </p>
                <p className="font-medium text-neutral-900">{selectedSession.name}</p>
                <p className="text-sm text-neutral-600">
                  {getDayName(selectedSession.dayOfWeek)}, {selectedSession.startTime} - {selectedSession.endTime}
                </p>
                <p className="text-sm text-neutral-600">{selectedSession.location}</p>
                <p className="text-sm font-medium text-neutral-700 mt-2">
                  {"\u00A3"}{(selectedSession.price / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Price Difference */}
            {selectedSession.priceDifference !== 0 && (
              <div
                className={cn(
                  "rounded-xl p-4 flex items-center gap-3",
                  selectedSession.priceDifference > 0
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-emerald-50 border border-emerald-200"
                )}
              >
                {selectedSession.priceDifference > 0 ? (
                  <>
                    <CreditCard className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Additional payment required
                      </p>
                      <p className="text-sm text-amber-700">
                        You will be charged {"\u00A3"}{(selectedSession.priceDifference / 100).toFixed(2)} for this upgrade.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Refund will be issued</p>
                      <p className="text-sm text-emerald-700">
                        You will receive a refund of {"\u00A3"}{(Math.abs(selectedSession.priceDifference) / 100).toFixed(2)}.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
              <button
                onClick={() => setStep("select")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={processing}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors",
                  processing
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedSession.priceDifference > 0 ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay & Transfer
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm Transfer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === "complete" && transferResult && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Transfer Complete!
            </h2>
            <p className="text-neutral-600 mb-6">{transferResult.message}</p>

            {transferResult.refundAmount && transferResult.refundAmount > 0 && (
              <p className="text-sm text-emerald-600 mb-6">
                A refund of {"\u00A3"}{(transferResult.refundAmount / 100).toFixed(2)} will be processed to your original payment method.
              </p>
            )}

            <Link
              href={`/portal/bookings/${id}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              View Updated Booking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
