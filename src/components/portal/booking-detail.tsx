"use client";

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  QrCode,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Booking, Session } from "@/types/booking";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

interface BookingDetailProps {
  booking: Booking;
  session?: Session;
}

function formatDate(date: Date | Timestamp | undefined): string {
  if (!date) return "N/A";
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return format(d, "EEEE, MMMM d, yyyy");
}

function formatDateTime(date: Date | Timestamp | undefined): string {
  if (!date) return "N/A";
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return format(d, "MMM d, yyyy 'at' h:mm a");
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

function getPaymentStatusIcon(status: Booking["paymentStatus"]) {
  switch (status) {
    case "paid":
      return CheckCircle;
    case "pending":
      return AlertCircle;
    case "failed":
      return XCircle;
    default:
      return CreditCard;
  }
}

export function BookingDetail({ booking, session }: BookingDetailProps) {
  const sessionDate = session?.startDate;
  const formattedDate = formatDate(sessionDate);
  const PaymentIcon = getPaymentStatusIcon(booking.paymentStatus);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div
        className={cn(
          "rounded-xl p-4 flex items-center gap-3",
          booking.status === "confirmed" && "bg-emerald-50 border border-emerald-200",
          booking.status === "cancelled" && "bg-red-50 border border-red-200",
          booking.status === "waitlist" && "bg-amber-50 border border-amber-200"
        )}
      >
        {booking.status === "confirmed" && (
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        )}
        {booking.status === "cancelled" && (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        {booking.status === "waitlist" && (
          <AlertCircle className="h-5 w-5 text-amber-600" />
        )}
        <div>
          <p
            className={cn(
              "font-medium",
              booking.status === "confirmed" && "text-emerald-800",
              booking.status === "cancelled" && "text-red-800",
              booking.status === "waitlist" && "text-amber-800"
            )}
          >
            {booking.status === "confirmed" && "Booking Confirmed"}
            {booking.status === "cancelled" && "Booking Cancelled"}
            {booking.status === "waitlist" && "On Waitlist"}
          </p>
          <p
            className={cn(
              "text-sm",
              booking.status === "confirmed" && "text-emerald-700",
              booking.status === "cancelled" && "text-red-700",
              booking.status === "waitlist" && "text-amber-700"
            )}
          >
            Booking Reference: {booking.bookingRef}
          </p>
        </div>
      </div>

      {/* Session Details Card */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Session Details
        </h2>

        {session ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-neutral-900">{session.name}</h3>
              {session.description && (
                <p className="text-sm text-neutral-600 mt-1">
                  {session.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-neutral-600">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Date</p>
                  <p className="text-sm font-medium">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-neutral-600">
                <Clock className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Time</p>
                  <p className="text-sm font-medium">
                    {session.startTime} - {session.endTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-neutral-600">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Location</p>
                  <p className="text-sm font-medium">{session.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-neutral-600">
                <User className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Age Range</p>
                  <p className="text-sm font-medium">
                    {session.ageMin} - {session.ageMax} years
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-neutral-500">Session details not available</p>
        )}
      </div>

      {/* Child Details Card */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Child Details
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Name</p>
              <p className="font-medium text-neutral-900">
                {booking.childFirstName} {booking.childLastName}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-400 mb-1">Age Group</p>
            <p className="text-sm text-neutral-700">{booking.ageGroup}</p>
          </div>

          {booking.medicalConditions && (
            <div>
              <p className="text-xs text-neutral-400 mb-1">Medical Conditions</p>
              <p className="text-sm text-neutral-700">
                {booking.medicalConditions}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Details Card */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Contact Details
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Parent/Guardian</p>
              <p className="font-medium text-neutral-900">
                {booking.parentFirstName} {booking.parentLastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Email</p>
              <p className="text-sm text-neutral-700">{booking.parentEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Phone</p>
              <p className="text-sm text-neutral-700">{booking.parentPhone}</p>
            </div>
          </div>

          {booking.emergencyContact && (
            <div className="pt-3 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 mb-2">Emergency Contact</p>
              <p className="text-sm font-medium text-neutral-700">
                {booking.emergencyContact.name}
              </p>
              <p className="text-sm text-neutral-600">
                {booking.emergencyContact.phone}
                {booking.emergencyContact.relationship &&
                  ` (${booking.emergencyContact.relationship})`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Card */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Payment Details
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PaymentIcon
                className={cn(
                  "h-5 w-5",
                  booking.paymentStatus === "paid" && "text-emerald-600",
                  booking.paymentStatus === "pending" && "text-amber-600",
                  booking.paymentStatus === "failed" && "text-red-600"
                )}
              />
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                  getPaymentStatusColor(booking.paymentStatus)
                )}
              >
                {booking.paymentStatus.charAt(0).toUpperCase() +
                  booking.paymentStatus.slice(1).replace("_", " ")}
              </span>
            </div>
            <span className="text-xl font-semibold text-neutral-900">
              {"\u00A3"}{(booking.amount / 100).toFixed(2)}
            </span>
          </div>

          {booking.refundedAmount && booking.refundedAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Refunded</span>
              <span className="font-medium text-neutral-700">
                -{"\u00A3"}{(booking.refundedAmount / 100).toFixed(2)}
              </span>
            </div>
          )}

          {booking.stripePaymentIntentId && (
            <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
              Payment ID: {booking.stripePaymentIntentId.substring(0, 20)}...
            </div>
          )}
        </div>
      </div>

      {/* Transfer Session */}
      {booking.status === "confirmed" && booking.paymentStatus === "paid" && (
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Need to Change Sessions?
          </h2>

          <p className="text-sm text-neutral-600 mb-4">
            Transfer this booking to a different session. Price differences will be
            handled automatically - pay the difference for upgrades or receive a
            refund for downgrades.
          </p>

          {booking.transferredFrom && (
            <div className="mb-4 px-3 py-2 bg-sky-50 border border-sky-100 rounded-lg">
              <p className="text-xs text-sky-600">
                This booking was transferred on{" "}
                {booking.transferredAt
                  ? format(
                      booking.transferredAt instanceof Timestamp
                        ? booking.transferredAt.toDate()
                        : new Date(booking.transferredAt),
                      "MMM d, yyyy"
                    )
                  : "a previous date"}
              </p>
            </div>
          )}

          <Link
            href={`/portal/bookings/${booking.id}/transfer`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Transfer to Another Session
          </Link>
        </div>
      )}

      {/* QR Code Placeholder */}
      {booking.status === "confirmed" && (
        <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Check-in QR Code
          </h2>

          <div className="flex flex-col items-center justify-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <QrCode className="h-16 w-16 text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-500 text-center">
              QR code for check-in will be available here
            </p>
            <p className="text-xs text-neutral-400 mt-1">Coming soon</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Booking Timeline
        </h2>

        <div className="relative">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-neutral-200" />

          <div className="space-y-4">
            <div className="relative pl-8">
              <div className="absolute left-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow" />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Booking Created
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDateTime(booking.createdAt)}
                </p>
              </div>
            </div>

            {booking.paymentStatus === "paid" && (
              <div className="relative pl-8">
                <div className="absolute left-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Payment Confirmed
                  </p>
                  <p className="text-xs text-neutral-500">
                    Payment of {"\u00A3"}{(booking.amount / 100).toFixed(2)} received
                  </p>
                </div>
              </div>
            )}

            {booking.refundedAt && (
              <div className="relative pl-8">
                <div className="absolute left-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Refund Issued</p>
                  <p className="text-xs text-neutral-500">
                    {formatDateTime(booking.refundedAt)}
                  </p>
                </div>
              </div>
            )}

            {booking.status === "cancelled" && (
              <div className="relative pl-8">
                <div className="absolute left-0 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Booking Cancelled
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
