"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/bookings"
            className="flex h-10 w-10 items-center justify-center border border-neutral-200 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-wide text-black">
            Booking Not Found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/bookings"
            className="flex h-10 w-10 items-center justify-center border border-neutral-200 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-black">
              Booking Details
            </h1>
            <p className="text-neutral-500 font-mono">{booking.bookingRef}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-sm font-bold uppercase ${
            booking.paymentStatus === "paid"
              ? "bg-green-100 text-green-700"
              : booking.paymentStatus === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {booking.paymentStatus}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Child Information */}
        <div className="border border-neutral-200 bg-white p-6">
          <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-black mb-4">
            <User className="h-4 w-4" />
            Child Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Full Name
              </p>
              <p className="mt-1 font-medium">
                {booking.childFirstName} {booking.childLastName}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Date of Birth
              </p>
              <p className="mt-1">{formatDate(booking.childDOB)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Age Group
              </p>
              <p className="mt-1">{booking.ageGroup}</p>
            </div>
            {booking.medicalConditions && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Medical Conditions
                </p>
                <p className="mt-1">{booking.medicalConditions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="border border-neutral-200 bg-white p-6">
          <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-black mb-4">
            <User className="h-4 w-4" />
            Parent/Guardian
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Full Name
              </p>
              <p className="mt-1 font-medium">
                {booking.parentFirstName} {booking.parentLastName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Email
                </p>
                <a
                  href={`mailto:${booking.parentEmail}`}
                  className="mt-1 text-black hover:underline"
                >
                  {booking.parentEmail}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Phone
                </p>
                <a
                  href={`tel:${booking.parentPhone}`}
                  className="mt-1 text-black hover:underline"
                >
                  {booking.parentPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Session Information */}
        <div className="border border-neutral-200 bg-white p-6">
          <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-black mb-4">
            <Calendar className="h-4 w-4" />
            Session Details
          </h2>
          <div className="space-y-4">
            {program && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Program
                </p>
                <p className="mt-1 font-medium">{program.name}</p>
              </div>
            )}
            {session && (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Session
                  </p>
                  <p className="mt-1 font-medium">{session.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Time
                    </p>
                    <p className="mt-1">
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                </div>
              </>
            )}
            {program && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Location
                  </p>
                  <p className="mt-1">{program.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="border border-neutral-200 bg-white p-6">
          <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-black mb-4">
            <CreditCard className="h-4 w-4" />
            Payment Details
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Amount
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatPrice(booking.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Status
              </p>
              <span
                className={`mt-1 inline-block px-2 py-1 text-xs font-bold uppercase ${
                  booking.paymentStatus === "paid"
                    ? "bg-green-100 text-green-700"
                    : booking.paymentStatus === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {booking.paymentStatus}
              </span>
            </div>
            {booking.stripeSessionId && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Stripe Session ID
                </p>
                <p className="mt-1 font-mono text-xs break-all">
                  {booking.stripeSessionId}
                </p>
              </div>
            )}
            {booking.stripePaymentIntentId && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Payment Intent ID
                </p>
                <p className="mt-1 font-mono text-xs break-all">
                  {booking.stripePaymentIntentId}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Metadata */}
      <div className="border border-neutral-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-black mb-4">
          <FileText className="h-4 w-4" />
          Booking Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Booking Reference
            </p>
            <p className="mt-1 font-mono">{booking.bookingRef}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Created At
            </p>
            <p className="mt-1">{formatDateTime(booking.createdAt)}</p>
          </div>
          {booking.updatedAt && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Last Updated
              </p>
              <p className="mt-1">{formatDateTime(booking.updatedAt)}</p>
            </div>
          )}
        </div>

        {booking.emergencyContact && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Emergency Contact
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-neutral-600">Name</p>
                <p className="font-medium">{booking.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Phone</p>
                <p className="font-medium">{booking.emergencyContact.phone}</p>
              </div>
              {booking.emergencyContact.relationship && (
                <div>
                  <p className="text-sm text-neutral-600">Relationship</p>
                  <p className="font-medium">
                    {booking.emergencyContact.relationship}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="secondary" asChild>
          <Link href="/admin/bookings">Back to Bookings</Link>
        </Button>
      </div>
    </div>
  );
}
