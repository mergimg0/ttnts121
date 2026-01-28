"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Booking, Session } from "@/types/booking";
import { BookingDetail } from "@/components/portal/booking-detail";
import { Loader2, ArrowLeft } from "lucide-react";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookingDetail() {
      if (!firebaseUser || !id) return;

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/portal/bookings/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setBooking(data.data.booking);
          setSession(data.data.session);
        } else {
          if (response.status === 404) {
            setError("Booking not found");
          } else if (response.status === 403) {
            setError("You don't have access to this booking");
          } else {
            setError(data.error || "Failed to load booking");
          }
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetail();
  }, [firebaseUser, id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
            <p className="text-neutral-500">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
          <div className="flex flex-col items-center justify-center">
            <p className="text-red-500 mb-4">{error || "Booking not found"}</p>
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/portal/bookings"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      {/* Booking Detail */}
      <BookingDetail booking={booking} session={session || undefined} />
    </div>
  );
}
