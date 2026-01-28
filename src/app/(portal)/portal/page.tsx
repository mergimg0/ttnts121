"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Booking, Session } from "@/types/booking";
import { BookingCard } from "@/components/portal/booking-card";
import {
  Loader2,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Settings,
} from "lucide-react";

interface BookingWithSession {
  booking: Booking;
  session?: Session;
}

export default function PortalDashboardPage() {
  const { user, firebaseUser } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      if (!firebaseUser) return;

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch("/api/portal/bookings?filter=upcoming", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setUpcomingBookings(data.data.slice(0, 3)); // Show max 3 upcoming
        } else {
          setError(data.error || "Failed to load bookings");
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [firebaseUser]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="rounded-xl lg:rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Welcome back{user ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="text-sky-100 text-sm lg:text-base">
          Manage your bookings and account settings from your personal portal.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/portal/bookings"
          className="group flex items-center gap-4 rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 p-4 lg:p-5"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
            <Calendar className="h-6 w-6 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900">My Bookings</p>
            <p className="text-sm text-neutral-500">View all sessions</p>
          </div>
          <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/portal/settings"
          className="group flex items-center gap-4 rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 p-4 lg:p-5"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900">My Children</p>
            <p className="text-sm text-neutral-500">Manage profiles</p>
          </div>
          <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/sessions"
          className="group flex items-center gap-4 rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 p-4 lg:p-5"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900">Book Session</p>
            <p className="text-sm text-neutral-500">Find new classes</p>
          </div>
          <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Upcoming Bookings */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Upcoming Sessions
          </h2>
          <Link
            href="/portal/bookings"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">{error}</p>
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-4">No upcoming sessions</p>
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              Browse available sessions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map(({ booking, session }) => (
              <BookingCard key={booking.id} booking={booking} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Account Info Card */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Account Information
          </h2>
          <Link
            href="/portal/settings"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            Edit
          </Link>
        </div>

        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Name</p>
              <p className="text-sm font-medium text-neutral-900">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-neutral-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Phone</p>
              <p className="text-sm font-medium text-neutral-900">
                {user.phone || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Children</p>
              <p className="text-sm font-medium text-neutral-900">
                {user.children?.length || 0} registered
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        )}
      </div>
    </div>
  );
}
