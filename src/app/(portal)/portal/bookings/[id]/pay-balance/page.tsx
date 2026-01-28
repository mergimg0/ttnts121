"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import {
  Loader2,
  ArrowLeft,
  CreditCard,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BalanceDetails {
  bookingRef: string;
  childFirstName: string;
  childLastName: string;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  balanceDueDate: string;
  paymentStatus: string;
  sessions: Array<{
    id: string;
    name: string;
    dayOfWeek: number;
    startTime: string;
  }>;
}

interface PayBalancePageProps {
  params: Promise<{ id: string }>;
}

export default function PayBalancePage({ params }: PayBalancePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuth();
  const [balanceDetails, setBalanceDetails] = useState<BalanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelled = searchParams.get("cancelled") === "true";

  useEffect(() => {
    async function fetchBalanceDetails() {
      if (!firebaseUser || !id) return;

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/portal/bookings/${id}/pay-balance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setBalanceDetails(data.data);
        } else {
          if (response.status === 404) {
            setError("Booking not found");
          } else if (response.status === 403) {
            setError("You don't have access to this booking");
          } else {
            setError(data.error || "Failed to load balance details");
          }
        }
      } catch (err) {
        console.error("Error fetching balance details:", err);
        setError("Failed to load balance details");
      } finally {
        setLoading(false);
      }
    }

    fetchBalanceDetails();
  }, [firebaseUser, id]);

  const handlePayBalance = async () => {
    if (!firebaseUser || !id) return;

    setProcessing(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/portal/bookings/${id}/pay-balance`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Failed to create payment session");
      }
    } catch (err) {
      console.error("Error creating payment session:", err);
      setError("Failed to create payment session");
    } finally {
      setProcessing(false);
    }
  };

  // Check if balance is already paid
  const isBalancePaid = balanceDetails?.paymentStatus === "paid";

  // Check if balance is overdue
  const isOverdue = balanceDetails?.balanceDueDate
    ? new Date(balanceDetails.balanceDueDate) < new Date()
    : false;

  // Format the due date
  const formattedDueDate = balanceDetails?.balanceDueDate
    ? new Date(balanceDetails.balanceDueDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
            <p className="text-neutral-500">Loading balance details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !balanceDetails) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
            <p className="text-red-500 mb-4">{error || "Balance details not found"}</p>
            <Link
              href="/portal/bookings"
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isBalancePaid) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href={`/portal/bookings/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to booking
        </Link>

        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Balance Already Paid
            </h2>
            <p className="text-neutral-500 mb-6">
              Great news! The full payment for this booking has already been completed.
            </p>
            <Button asChild>
              <Link href={`/portal/bookings/${id}`}>View Booking Details</Link>
            </Button>
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

      {/* Cancelled Notice */}
      {cancelled && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Payment Cancelled</p>
              <p className="text-sm text-amber-700 mt-1">
                Your payment was cancelled. You can try again when you're ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-50 border-b border-neutral-200/60 px-6 py-4">
          <h1 className="text-lg font-semibold text-neutral-900">Pay Outstanding Balance</h1>
          <p className="text-sm text-neutral-500">
            Booking ref: {balanceDetails.bookingRef}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Child Info */}
          <div>
            <p className="text-sm text-neutral-500">Player</p>
            <p className="font-medium text-neutral-900">
              {balanceDetails.childFirstName} {balanceDetails.childLastName}
            </p>
          </div>

          {/* Sessions */}
          <div>
            <p className="text-sm text-neutral-500 mb-2">Sessions</p>
            <div className="space-y-2">
              {balanceDetails.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 text-sm bg-neutral-50 rounded-lg p-3"
                >
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span className="font-medium">{session.name}</span>
                  <span className="text-neutral-500">
                    {getDayName(session.dayOfWeek)} at {session.startTime}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <p className="text-sm font-medium text-neutral-700">Payment Summary</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Total Amount</span>
                <span className="font-medium">{formatPrice(balanceDetails.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Deposit Paid</span>
                <span className="font-medium text-emerald-600">
                  -{formatPrice(balanceDetails.depositPaid)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-neutral-200">
                <span className="font-semibold text-neutral-900">Balance Due</span>
                <span className="font-bold text-neutral-900">
                  {formatPrice(balanceDetails.balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div
            className={`rounded-lg p-4 flex items-start gap-3 ${
              isOverdue
                ? "bg-red-50 border border-red-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            <Clock
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                isOverdue ? "text-red-600" : "text-amber-600"
              }`}
            />
            <div>
              <p className={`font-medium ${isOverdue ? "text-red-900" : "text-amber-900"}`}>
                {isOverdue ? "Payment Overdue" : "Payment Due Date"}
              </p>
              <p className={`text-sm ${isOverdue ? "text-red-700" : "text-amber-700"}`}>
                {isOverdue
                  ? `This payment was due on ${formattedDueDate}. Please pay as soon as possible.`
                  : `Please complete payment by ${formattedDueDate}`}
              </p>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePayBalance}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {formatPrice(balanceDetails.balanceDue)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-neutral-500">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
