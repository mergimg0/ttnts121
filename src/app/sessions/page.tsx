"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Plus, Check, Bell, ChevronDown, ArrowRight, MapPin, Users, Calendar } from "lucide-react";
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
      } else {
        setError("Failed to load sessions.");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Unable to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCart = (session: SessionWithProgram) => {
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

  const getLocationName = (id: string) => {
    return LOCATIONS.find((l) => l.id === id)?.name || id;
  };

  const activeFiltersCount = [filters.location, filters.serviceType].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-navy py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-display text-4xl tracking-tight text-white sm:text-5xl lg:text-6xl">
              Book a Session
            </h1>
            <p className="mt-6 text-lg text-white/70">
              Find and book the perfect session for your child.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="relative">
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all cursor-pointer hover:border-neutral-300"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Service Type Filter */}
            <div className="relative">
              <select
                value={filters.serviceType}
                onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all cursor-pointer hover:border-neutral-300"
              >
                <option value="">All Types</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilters({ location: "", serviceType: "" })}
                className="text-sm text-neutral-500 hover:text-navy transition-colors underline underline-offset-4"
              >
                Clear all
              </button>
            )}

            <span className="ml-auto text-sm text-neutral-400">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-sky" />
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <p className="text-neutral-500 text-lg mb-4">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchSessions(); }}
              className="text-sky hover:text-sky-muted text-sm font-medium"
            >
              Try again
            </button>
          </motion.div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <Calendar className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
            <p className="text-neutral-400 text-lg mb-2">No sessions found</p>
            <p className="text-neutral-400 text-sm">
              {activeFiltersCount > 0 ? "Try adjusting your filters" : "Check back soon"}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilters({ location: "", serviceType: "" })}
                className="mt-4 text-sky hover:text-sky-muted text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session, index) => {
              const inCart = isInCart(session.id);
              const isFull = session.availabilityStatus === "full";

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className={`relative bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                      isFull ? "opacity-60" : ""
                    }`}
                  >
                    {/* Card Content */}
                    <div className="p-5">
                      {/* Top Row: Day Badge & Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-navy text-white text-sm font-bold">
                            {getDayName(session.dayOfWeek).slice(0, 3)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {session.startTime} – {session.endTime}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {getDayName(session.dayOfWeek)}s
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          isFull
                            ? "bg-neutral-100 text-neutral-500"
                            : session.availabilityStatus === "limited"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isFull
                            ? "Full"
                            : session.availabilityStatus === "limited"
                              ? `${session.spotsLeft} left`
                              : "Open"
                          }
                        </span>
                      </div>

                      {/* Session Name */}
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {session.name}
                      </h3>

                      {/* Details */}
                      <div className="flex items-center gap-4 text-sm text-foreground-muted mb-4">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {session.program ? getLocationName(session.program.location) : "TBA"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Ages {session.ageMin}–{session.ageMax}
                        </span>
                      </div>

                      {/* Bottom Row: Price & Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                        <div>
                          <p className="text-xs text-foreground-muted">Per session</p>
                          <p className="text-xl font-bold text-foreground">
                            {formatPrice(session.price)}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        {isFull && session.waitlistEnabled ? (
                          <button
                            onClick={() => setWaitlistSession(session)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-foreground transition-colors"
                          >
                            <Bell className="w-4 h-4" />
                            Notify me
                          </button>
                        ) : (
                          <motion.button
                            onClick={() => !isFull && handleToggleCart(session)}
                            disabled={isFull}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                              isFull
                                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                : inCart
                                  ? "bg-emerald-500 text-white"
                                  : "bg-navy text-white hover:bg-navy-deep"
                            }`}
                          >
                            <AnimatePresence mode="wait">
                              {inCart ? (
                                <motion.span
                                  key="added"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" />
                                  Added
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="add"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* In Cart Indicator */}
                    <AnimatePresence>
                      {inCart && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-navy text-white px-5 py-2.5 text-center"
                        >
                          <p className="text-xs font-medium">Added to cart</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Checkout CTA */}
        {!loading && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Link
              href="/checkout"
              className="group inline-flex items-center gap-2 text-sm font-medium text-sky hover:text-sky-muted transition-colors"
            >
              Continue to checkout
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
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
