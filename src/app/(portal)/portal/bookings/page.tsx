"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Booking, Session } from "@/types/booking";
import { BookingCard } from "@/components/portal/booking-card";
import { Loader2, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingWithSession {
  booking: Booking;
  session?: Session;
}

type FilterType = "all" | "upcoming" | "past" | "cancelled";

const filterOptions: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
  { label: "Cancelled", value: "cancelled" },
];

export default function PortalBookingsPage() {
  const { firebaseUser } = useAuth();
  const [bookings, setBookings] = useState<BookingWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("upcoming");

  useEffect(() => {
    async function fetchBookings() {
      if (!firebaseUser) return;

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const filterParam = activeFilter === "all" ? "" : `?filter=${activeFilter}`;
        const response = await fetch(`/api/portal/bookings${filterParam}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setBookings(data.data);
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
  }, [firebaseUser, activeFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Bookings</h1>
        <p className="text-neutral-500 mt-1">
          View and manage all your session bookings
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-1.5">
        <div className="flex flex-wrap gap-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                activeFilter === option.value
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
              <p className="text-neutral-500">Loading bookings...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
            <div className="flex flex-col items-center justify-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={() => setActiveFilter(activeFilter)}
                className="text-sm text-sky-600 hover:text-sky-700"
              >
                Try again
              </button>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12">
            <div className="flex flex-col items-center justify-center">
              <Calendar className="h-16 w-16 text-neutral-300 mb-4" />
              <p className="text-lg font-medium text-neutral-700 mb-1">
                No {activeFilter !== "all" ? activeFilter : ""} bookings
              </p>
              <p className="text-neutral-500 text-sm">
                {activeFilter === "upcoming"
                  ? "You don't have any upcoming sessions."
                  : activeFilter === "past"
                  ? "You haven't attended any sessions yet."
                  : activeFilter === "cancelled"
                  ? "You don't have any cancelled bookings."
                  : "You haven't made any bookings yet."}
              </p>
            </div>
          </div>
        ) : (
          bookings.map(({ booking, session }) => (
            <BookingCard key={booking.id} booking={booking} session={session} />
          ))
        )}
      </div>

      {/* Booking Count */}
      {!loading && !error && bookings.length > 0 && (
        <p className="text-sm text-neutral-400 text-center">
          Showing {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
