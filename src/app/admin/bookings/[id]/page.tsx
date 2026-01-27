"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";
import { Booking, Session, Program } from "@/types/booking";
import { formatPrice } from "@/lib/booking-utils";

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}`);
      const data = await response.json();
      if (data.success) {
        setBooking(data.data);

        // Fetch session details
        if (data.data.sessionId) {
          const sessionRes = await fetch(
            `/api/admin/sessions/${data.data.sessionId}`
          );
          const sessionData = await sessionRes.json();
          if (sessionData.success) {
            setSession(sessionData.data);

            // Fetch program details
            if (sessionData.data.programId) {
              const programRes = await fetch(
                `/api/admin/programs/${sessionData.data.programId}`
              );
              const programData = await programRes.json();
              if (programData.success) {
                setProgram(programData.data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return "-";
    const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: any): string => {
    if (!date) return "-";
    const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return d.toLocaleString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/bookings"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900">
            Booking Not Found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/bookings"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Booking Details
            </h1>
            <p className="text-[13px] text-neutral-500 font-mono">{booking.bookingRef}</p>
          </div>
        </div>
        <AdminBadge
          variant={
            booking.paymentStatus === "paid"
              ? "success"
              : booking.paymentStatus === "pending"
                ? "warning"
                : "error"
          }
        >
          {booking.paymentStatus}
        </AdminBadge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Child Information */}
        <AdminCard hover={false}>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900 mb-4">
            <User className="h-4 w-4 text-neutral-400" />
            Child Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Full Name
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {booking.childFirstName} {booking.childLastName}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Date of Birth
              </p>
              <p className="mt-1 text-sm text-neutral-600">{formatDate(booking.childDOB)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Age Group
              </p>
              <p className="mt-1 text-sm text-neutral-600">{booking.ageGroup}</p>
            </div>
            {booking.medicalConditions && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Medical Conditions
                </p>
                <p className="mt-1 text-sm text-neutral-600">{booking.medicalConditions}</p>
              </div>
            )}
          </div>
        </AdminCard>

        {/* Parent/Guardian Information */}
        <AdminCard hover={false}>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900 mb-4">
            <User className="h-4 w-4 text-neutral-400" />
            Parent/Guardian
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Full Name
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {booking.parentFirstName} {booking.parentLastName}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Email
                </p>
                <a
                  href={`mailto:${booking.parentEmail}`}
                  className="mt-1 text-sm text-sky-600 hover:text-sky-700 transition-colors"
                >
                  {booking.parentEmail}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Phone
                </p>
                <a
                  href={`tel:${booking.parentPhone}`}
                  className="mt-1 text-sm text-sky-600 hover:text-sky-700 transition-colors"
                >
                  {booking.parentPhone}
                </a>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Session Information */}
        <AdminCard hover={false}>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900 mb-4">
            <Calendar className="h-4 w-4 text-neutral-400" />
            Session Details
          </h2>
          <div className="space-y-4">
            {program && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Program
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">{program.name}</p>
              </div>
            )}
            {session && (
              <>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Session
                  </p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{session.name}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Time
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                </div>
              </>
            )}
            {program && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">{program.location}</p>
                </div>
              </div>
            )}
          </div>
        </AdminCard>

        {/* Payment Information */}
        <AdminCard hover={false}>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900 mb-4">
            <CreditCard className="h-4 w-4 text-neutral-400" />
            Payment Details
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Amount
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
                {formatPrice(booking.amount)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Status
              </p>
              <AdminBadge
                variant={
                  booking.paymentStatus === "paid"
                    ? "success"
                    : booking.paymentStatus === "pending"
                      ? "warning"
                      : "error"
                }
              >
                {booking.paymentStatus}
              </AdminBadge>
            </div>
            {booking.stripeSessionId && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Stripe Session ID
                </p>
                <p className="mt-1 font-mono text-[11px] text-neutral-500 break-all">
                  {booking.stripeSessionId}
                </p>
              </div>
            )}
            {booking.stripePaymentIntentId && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Payment Intent ID
                </p>
                <p className="mt-1 font-mono text-[11px] text-neutral-500 break-all">
                  {booking.stripePaymentIntentId}
                </p>
              </div>
            )}
          </div>
        </AdminCard>
      </div>

      {/* Booking Metadata */}
      <AdminCard hover={false}>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900 mb-4">
          <FileText className="h-4 w-4 text-neutral-400" />
          Booking Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Booking Reference
            </p>
            <p className="mt-1 font-mono text-sm text-neutral-600">{booking.bookingRef}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Created At
            </p>
            <p className="mt-1 text-sm text-neutral-600">{formatDateTime(booking.createdAt)}</p>
          </div>
          {booking.updatedAt && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Last Updated
              </p>
              <p className="mt-1 text-sm text-neutral-600">{formatDateTime(booking.updatedAt)}</p>
            </div>
          )}
        </div>

        {booking.emergencyContact && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Emergency Contact
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[13px] text-neutral-500">Name</p>
                <p className="text-sm font-medium text-neutral-900">{booking.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-[13px] text-neutral-500">Phone</p>
                <p className="text-sm font-medium text-neutral-900">{booking.emergencyContact.phone}</p>
              </div>
              {booking.emergencyContact.relationship && (
                <div>
                  <p className="text-[13px] text-neutral-500">Relationship</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {booking.emergencyContact.relationship}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminCard>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="adminSecondary" asChild>
          <Link href="/admin/bookings">Back to Bookings</Link>
        </Button>
      </div>
    </div>
  );
}
