"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Plus, Check } from "lucide-react";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import { LOCATIONS } from "@/lib/constants";
import { useCart } from "@/components/cart/cart-provider";
import { motion, AnimatePresence } from "motion/react";

interface SessionData {
  id: string;
  name: string;
  programId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  ageMin: number;
  ageMax: number;
  price: number;
  spotsLeft: number;
  availabilityStatus: "available" | "limited" | "full";
  description?: string;
  program: {
    name: string;
    location: string;
  } | null;
}

export function SessionsOverview() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { addItem, removeItem, isInCart } = useCart();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/sessions?limit=6");
        const data = await response.json();
        if (data.success) {
          setSessions(data.data.slice(0, 6));
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const getLocationName = (id: string) => {
    return LOCATIONS.find((l) => l.id === id)?.name || id;
  };

  const handleToggleCart = (session: SessionData) => {
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

  return (
    <section className="py-32 sm:py-40 bg-[#FAFAFA]">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase text-neutral-400 mb-4">
            Book a Session
          </p>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.03em] text-[#1d1d1f] leading-[1.1]">
            Find the perfect
            <br />
            <span className="text-neutral-400">session for your child.</span>
          </h2>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <p className="text-neutral-400 text-lg">
              No sessions available right now.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Sessions Grid */}
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session, index) => {
                const inCart = isInCart(session.id);
                const isHovered = hoveredId === session.id;
                const isFull = session.availabilityStatus === "full";

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    onMouseEnter={() => setHoveredId(session.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative"
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
                            <span className="text-[15px] text-neutral-500">
                              {session.startTime}
                            </span>
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
                        <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-[#1d1d1f] leading-tight mb-2">
                          {session.name}
                        </h3>

                        {/* Location & Ages */}
                        <p className="text-[15px] text-neutral-500 mb-1">
                          {session.program ? getLocationName(session.program.location) : "TBA"}
                        </p>
                        <p className="text-[13px] text-neutral-400">
                          Ages {session.ageMin}–{session.ageMax}
                        </p>

                        {/* Bottom Row: Price & Action */}
                        <div className="flex items-end justify-between mt-8 pt-6 border-t border-neutral-100">
                          <div>
                            <p className="text-[13px] text-neutral-400 mb-1">Per session</p>
                            <p className="text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                              {formatPrice(session.price)}
                            </p>
                          </div>

                          {/* Add Button */}
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

            {/* View All Link */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-16 text-center"
            >
              <Link
                href="/sessions"
                className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#06c] hover:text-[#06c]/80 transition-colors"
              >
                View all sessions
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </>
        )}
      </Container>
    </section>
  );
}
