"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Plus, Check, Bell, ChevronDown, ArrowRight } from "lucide-react";
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="text-[13px] font-medium tracking-[0.2em] uppercase text-neutral-400 mb-4">
              Sessions
            </p>
            <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-semibold tracking-[-0.03em] text-[#1d1d1f] leading-[1.05]">
              Choose a session
              <br />
              <span className="text-neutral-400">that fits your schedule.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-20 z-40 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="relative">
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="appearance-none bg-white border border-neutral-200 rounded-full px-5 py-2.5 pr-10 text-[14px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-neutral-300 transition-all cursor-pointer hover:border-neutral-300"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Service Type Filter */}
            <div className="relative">
              <select
                value={filters.serviceType}
                onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                className="appearance-none bg-white border border-neutral-200 rounded-full px-5 py-2.5 pr-10 text-[14px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-neutral-300 transition-all cursor-pointer hover:border-neutral-300"
              >
                <option value="">All Types</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilters({ location: "", serviceType: "" })}
                className="text-[14px] text-neutral-500 hover:text-[#1d1d1f] transition-colors underline underline-offset-4"
              >
                Clear all
              </button>
            )}

            <span className="ml-auto text-[14px] text-neutral-400">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
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
              className="text-[#06c] hover:text-[#06c]/80 text-[15px] font-medium"
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
            <p className="text-neutral-400 text-lg mb-2">No sessions found</p>
            <p className="text-neutral-400 text-[15px]">
              {activeFiltersCount > 0 ? "Try adjusting your filters" : "Check back soon"}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilters({ location: "", serviceType: "" })}
                className="mt-4 text-[#06c] hover:text-[#06c]/80 text-[15px] font-medium"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session, index) => {
              const inCart = isInCart(session.id);
              const isHovered = hoveredId === session.id;
              const isFull = session.availabilityStatus === "full";

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.05,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group"
                >
                  <motion.div
                    animate={{
                      y: isHovered ? -4 : 0,
                      boxShadow: isHovered
                        ? "0 20px 40px -12px rgba(0,0,0,0.15)"
                        : "0 4px 20px -4px rgba(0,0,0,0.06)"
                    }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative bg-white rounded-2xl overflow-hidden ${
                      isFull ? "opacity-60" : ""
                    }`}
                  >
                    {/* Card Content */}
                    <div className="p-7">
                      {/* Top Row: Day & Time */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F7] text-[13px] font-semibold text-[#1d1d1f]">
                            {getDayName(session.dayOfWeek).slice(0, 2)}
                          </span>
                          <div>
                            <p className="text-[15px] text-[#1d1d1f] font-medium">
                              {session.startTime} – {session.endTime}
                            </p>
                            <p className="text-[13px] text-neutral-400">
                              {getDayName(session.dayOfWeek)}s
                            </p>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isFull
                              ? "bg-neutral-300"
                              : session.availabilityStatus === "limited"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }`} />
                          <span className="text-[13px] text-neutral-400">
                            {isFull
                              ? "Full"
                              : session.availabilityStatus === "limited"
                                ? `${session.spotsLeft} left`
                                : "Open"
                            }
                          </span>
                        </div>
                      </div>

                      {/* Session Name */}
                      <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-[#1d1d1f] leading-tight mb-3">
                        {session.name}
                      </h3>

                      {/* Details */}
                      <div className="space-y-1 mb-6">
                        <p className="text-[15px] text-neutral-500">
                          {session.program ? getLocationName(session.program.location) : "TBA"}
                        </p>
                        <p className="text-[13px] text-neutral-400">
                          Ages {session.ageMin}–{session.ageMax} years
                        </p>
                      </div>

                      {/* Bottom Row: Price & Action */}
                      <div className="flex items-end justify-between pt-6 border-t border-neutral-100">
                        <div>
                          <p className="text-[13px] text-neutral-400 mb-1">Per session</p>
                          <p className="text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                            {formatPrice(session.price)}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        {isFull && session.waitlistEnabled ? (
                          <button
                            onClick={() => setWaitlistSession(session)}
                            className="flex items-center gap-2 px-5 py-3 bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-full text-[14px] font-medium text-[#1d1d1f] transition-colors"
                          >
                            <Bell className="w-4 h-4" />
                            Notify me
                          </button>
                        ) : (
                          <motion.button
                            onClick={() => !isFull && handleToggleCart(session)}
                            disabled={isFull}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                              isFull
                                ? "bg-neutral-100 cursor-not-allowed"
                                : inCart
                                  ? "bg-[#1d1d1f] text-white"
                                  : "bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1d1d1f]"
                            }`}
                          >
                            <AnimatePresence mode="wait">
                              {inCart ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Check className="w-5 h-5" strokeWidth={2.5} />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="plus"
                                  initial={{ scale: 0, rotate: 180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: -180 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Plus className="w-5 h-5" strokeWidth={2} />
                                </motion.div>
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
                          className="bg-[#1d1d1f] text-white px-7 py-3 text-center"
                        >
                          <p className="text-[13px] font-medium">Added to cart</p>
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
            className="mt-16 text-center"
          >
            <Link
              href="/checkout"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#06c] hover:text-[#06c]/80 transition-colors"
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
