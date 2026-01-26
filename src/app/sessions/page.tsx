"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Users,
  ShoppingCart,
  Check,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { Session } from "@/types/booking";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import { LOCATIONS, SERVICE_TYPES } from "@/lib/constants";

interface SessionWithProgram extends Session {
  program: {
    id: string;
    name: string;
    location: string;
    serviceType: string;
    dateRange: { start: any; end: any };
  } | null;
  spotsLeft: number;
  availabilityStatus: "available" | "limited" | "full";
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionWithProgram | null>(null);
  const [filters, setFilters] = useState({
    location: "",
    serviceType: "",
  });
  const [waitlistSession, setWaitlistSession] = useState<SessionWithProgram | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addItem, removeItem, isInCart } = useCart();

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  const fetchSessions = async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.location) params.set("location", filters.location);
      if (filters.serviceType) params.set("serviceType", filters.serviceType);

      const response = await fetch(`/api/sessions?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
        if (data.data.length > 0 && !selectedSession) {
          setSelectedSession(data.data[0]);
        }
      } else {
        setError("Failed to load sessions. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Unable to load sessions. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (session: SessionWithProgram) => {
    if (isInCart(session.id)) {
      removeItem(session.id);
    } else {
      addItem({
        sessionId: session.id,
        sessionName: session.name,
        programId: session.programId,
        programName: session.program?.name || "",
        price: session.price,
        dayOfWeek: session.dayOfWeek,
        startTime: session.startTime,
        endTime: session.endTime,
        ageMin: session.ageMin,
        ageMax: session.ageMax,
      });
    }
  };

  const sessionsByDay = sessions.reduce(
    (acc, session) => {
      const day = session.dayOfWeek;
      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    },
    {} as Record<number, SessionWithProgram[]>
  );

  const getLocationName = (id: string) => {
    return LOCATIONS.find((l) => l.id === id)?.name || id;
  };

  const getStatusText = (session: SessionWithProgram) => {
    if (session.availabilityStatus === "full") return "Full";
    if (session.availabilityStatus === "limited") return `${session.spotsLeft} spots`;
    return "Available";
  };

  const activeFiltersCount = [filters.location, filters.serviceType].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="bg-navy py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="font-display text-3xl tracking-tight text-white sm:text-4xl lg:text-5xl">
              Book a Session
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              Browse sessions and add them to your cart
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="sticky top-20 z-40 bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:outline-none"
                >
                  <option value="">All Locations</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Service Type</label>
                <select
                  value={filters.serviceType}
                  onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-navy focus:outline-none"
                >
                  <option value="">All Types</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4">
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters({ location: "", serviceType: "" })}
                  className="text-sm text-neutral-500 hover:text-navy"
                >
                  Clear filters
                </button>
              )}
              <p className="text-sm text-neutral-400">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-neutral-500">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchSessions(); }}
              className="mt-4 text-sm text-navy hover:underline"
            >
              Try again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-4 text-neutral-500">No sessions found</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilters({ location: "", serviceType: "" })}
                className="mt-2 text-sm text-navy hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Sessions List */}
            <div>
              <h2 className="text-xs text-neutral-400 mb-4">Available Sessions</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-2">
                {sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;
                  const inCart = isInCart(session.id);
                  const isFull = session.availabilityStatus === "full";

                  return (
                    <motion.button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-navy text-white border-navy"
                          : "bg-white border-neutral-200 hover:border-neutral-300"
                      } ${isFull && !isSelected ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isSelected ? "text-white" : "text-foreground"}`}>
                            {session.name}
                          </p>
                          <p className={`text-xs mt-1 ${isSelected ? "text-white/60" : "text-neutral-500"}`}>
                            {getDayName(session.dayOfWeek)} · {session.startTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-foreground"}`}>
                            {formatPrice(session.price)}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            isSelected
                              ? isFull ? "text-white/40" : "text-white/60"
                              : isFull ? "text-neutral-400" : "text-neutral-500"
                          }`}>
                            {getStatusText(session)}
                          </p>
                        </div>
                      </div>
                      {inCart && (
                        <p className={`mt-2 text-xs flex items-center gap-1 ${
                          isSelected ? "text-white/60" : "text-neutral-500"
                        }`}>
                          <Check className="w-3 h-3" /> In cart
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Right: Calendar + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar View - Hidden on mobile */}
              <div className="hidden md:block bg-white rounded-xl border border-neutral-200 p-4">
                <h2 className="text-xs text-neutral-400 mb-4">Weekly Schedule</h2>
                <div className="grid grid-cols-7 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div key={day} className="text-center py-2 text-[11px] text-neutral-400">
                      {getDayName(day).slice(0, 3)}
                    </div>
                  ))}

                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div key={`content-${day}`} className="min-h-[100px] bg-neutral-50 rounded-lg p-1">
                      {sessionsByDay[day]?.map((session) => {
                        const isSelected = selectedSession?.id === session.id;
                        const inCart = isInCart(session.id);
                        const isFull = session.availabilityStatus === "full";

                        return (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`w-full mb-1 p-1.5 text-left text-[10px] rounded transition-all ${
                              isSelected
                                ? "bg-navy text-white"
                                : inCart
                                  ? "bg-neutral-200 text-foreground"
                                  : isFull
                                    ? "bg-neutral-100 text-neutral-400"
                                    : "bg-white border border-neutral-200 hover:border-neutral-300 text-foreground"
                            }`}
                          >
                            <p className="font-medium truncate">{session.name}</p>
                            <p className={isSelected ? "text-white/60" : "text-neutral-500"}>{session.startTime}</p>
                          </button>
                        );
                      })}
                      {!sessionsByDay[day]?.length && (
                        <p className="text-[10px] text-neutral-300 text-center mt-8">—</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Details Panel */}
              <AnimatePresence mode="wait">
                {selectedSession && (
                  <motion.div
                    key={selectedSession.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl border border-neutral-200 p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {selectedSession.name}
                        </h3>
                        {selectedSession.program && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {selectedSession.program.name}
                          </p>
                        )}
                        <p className={`text-sm mt-2 ${
                          selectedSession.availabilityStatus === "full"
                            ? "text-neutral-400"
                            : selectedSession.availabilityStatus === "limited"
                              ? "text-amber-600"
                              : "text-neutral-500"
                        }`}>
                          {selectedSession.availabilityStatus === "full"
                            ? "Currently full"
                            : selectedSession.availabilityStatus === "limited"
                              ? `${selectedSession.spotsLeft} spots remaining`
                              : "Spots available"}
                        </p>
                      </div>
                      <p className="text-2xl font-semibold text-navy">
                        {formatPrice(selectedSession.price)}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-100">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        <span className="text-foreground">{getDayName(selectedSession.dayOfWeek)}s</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span className="text-foreground">{selectedSession.startTime} – {selectedSession.endTime}</span>
                      </div>
                      {selectedSession.program && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-neutral-400" />
                          <span className="text-foreground">{getLocationName(selectedSession.program.location)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span className="text-foreground">Ages {selectedSession.ageMin}–{selectedSession.ageMax}</span>
                      </div>
                    </div>

                    {selectedSession.description && (
                      <p className="mt-6 text-sm text-neutral-600">
                        {selectedSession.description}
                      </p>
                    )}

                    <div className="mt-6 flex gap-3">
                      {selectedSession.availabilityStatus === "full" && selectedSession.waitlistEnabled ? (
                        <Button
                          onClick={() => setWaitlistSession(selectedSession)}
                          variant="secondary"
                          size="lg"
                          className="flex-1"
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          Join Waitlist
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(selectedSession)}
                          disabled={selectedSession.availabilityStatus === "full"}
                          variant={isInCart(selectedSession.id) ? "secondary" : "primary"}
                          size="lg"
                          className="flex-1"
                        >
                          {isInCart(selectedSession.id) ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      )}
                      <Button asChild variant="outline" size="lg">
                        <Link href="/checkout">
                          Checkout
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Waitlist Modal */}
      {waitlistSession && (
        <WaitlistForm
          session={waitlistSession}
          onClose={() => setWaitlistSession(null)}
        />
      )}
    </div>
  );
}
