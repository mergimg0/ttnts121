"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, User, CreditCard } from "lucide-react";
import { Booking, Session } from "@/types/booking";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

interface BookingCardProps {
  booking: Booking;
  session?: Session;
}

function formatDate(date: Date | Timestamp | undefined): string {
  if (!date) return "N/A";
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return format(d, "EEE, MMM d, yyyy");
}

function getPaymentStatusColor(status: Booking["paymentStatus"]) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    case "refunded":
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
    case "partially_refunded":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

function getBookingStatusColor(status: Booking["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    case "waitlist":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

export function BookingCard({ booking, session }: BookingCardProps) {
  const sessionDate = session?.startDate;
  const formattedDate = formatDate(sessionDate);

  return (
    <Link
      href={`/portal/bookings/${booking.id}`}
      className="block group"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl lg:rounded-2xl bg-white",
          "border border-neutral-200/60",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
          "transition-all duration-300 ease-out",
          "p-4 lg:p-5"
        )}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

        <div className="relative">
          {/* Header with booking ref and status */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                Booking Ref
              </p>
              <p className="text-sm font-semibold text-neutral-900">
                {booking.bookingRef}
              </p>
            </div>
            <div className="flex gap-2">
              {booking.status && (
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                    getBookingStatusColor(booking.status)
                  )}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              )}
            </div>
          </div>

          {/* Session info */}
          <div className="space-y-2 mb-4">
            {session && (
              <>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span>
                    {session.startTime} - {session.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  <span>{session.location}</span>
                </div>
              </>
            )}
          </div>

          {/* Child info */}
          <div className="flex items-center gap-2 text-sm text-neutral-700 mb-3">
            <User className="h-4 w-4 text-neutral-400" />
            <span className="font-medium">
              {booking.childFirstName} {booking.childLastName}
            </span>
          </div>

          {/* Footer with payment status and amount */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                getPaymentStatusColor(booking.paymentStatus)
              )}
            >
              <CreditCard className="h-3 w-3 mr-1.5" />
              {booking.paymentStatus.charAt(0).toUpperCase() +
                booking.paymentStatus.slice(1).replace("_", " ")}
            </span>
            <span className="text-sm font-semibold text-neutral-900">
              {"\u00A3"}{(booking.amount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
