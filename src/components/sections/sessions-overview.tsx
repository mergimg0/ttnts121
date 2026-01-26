"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { FadeInUp } from "@/lib/motion";
import { Calendar, Clock, MapPin, Users, ArrowRight, Loader2, Plus, Check } from "lucide-react";
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
    <section className="py-24 sm:py-32 bg-navy text-white">
      <Container>
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              Upcoming Sessions
            </h2>
            <p className="mt-6 text-lg text-white/70">
              Book your child&apos;s spot in one of our upcoming sessions.
            </p>
          </div>
        </FadeInUp>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-sky" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="mx-auto h-12 w-12 text-white/30" />
            <p className="mt-4 text-white/70">
              No sessions available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Sessions Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session, index) => {
                const inCart = isInCart(session.id);
                const isFull = session.availabilityStatus === "full";

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                  >
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className={`relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden ${
                        isFull ? "opacity-60" : ""
                      }`}
                    >
                      {/* Card Content */}
                      <div className="p-5">
                        {/* Top Row: Day Badge & Status */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-sky/20 text-sky text-sm font-bold">
                              {getDayName(session.dayOfWeek).slice(0, 3)}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {session.startTime} – {session.endTime}
                              </p>
                              <p className="text-xs text-white/50">
                                {getDayName(session.dayOfWeek)}s
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            isFull
                              ? "bg-white/10 text-white/50"
                              : session.availabilityStatus === "limited"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
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
                        <h3 className="text-lg font-bold text-white mb-2">
                          {session.name}
                        </h3>

                        {/* Details */}
                        <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
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
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div>
                            <p className="text-xs text-white/50">Per session</p>
                            <p className="text-xl font-bold text-white">
                              {formatPrice(session.price)}
                            </p>
                          </div>

                          {/* Add Button */}
                          <motion.button
                            onClick={() => !isFull && handleToggleCart(session)}
                            disabled={isFull}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                              isFull
                                ? "bg-white/5 text-white/30 cursor-not-allowed"
                                : inCart
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white text-navy hover:bg-white/90"
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
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* View All Link */}
            <FadeInUp>
              <div className="mt-12 text-center">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/sessions">
                    View All Sessions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </FadeInUp>
          </>
        )}
      </Container>
    </section>
  );
}
