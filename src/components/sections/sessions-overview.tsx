"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { FadeInUp } from "@/lib/motion";
import { Calendar, Clock, MapPin, Users, ArrowRight, Loader2, ShoppingCart, Check } from "lucide-react";
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
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const { addItem, removeItem, isInCart } = useCart();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/sessions?limit=6");
        const data = await response.json();
        if (data.success) {
          setSessions(data.data.slice(0, 6));
          if (data.data.length > 0) {
            setSelectedSession(data.data[0]);
          }
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

  const handleAddToCart = (session: SessionData) => {
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

  // Group sessions by day for calendar view
  const sessionsByDay = sessions.reduce(
    (acc, session) => {
      const day = session.dayOfWeek;
      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    },
    {} as Record<number, SessionData[]>
  );

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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Sessions List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">
                Available Sessions
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:max-h-[400px] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
                {sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;
                  const inCart = isInCart(session.id);

                  return (
                    <motion.button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-white text-navy border-white shadow-lg"
                          : inCart
                            ? "bg-emerald-500/20 border-emerald-400/30 hover:bg-emerald-500/30"
                            : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${
                            isSelected ? "text-navy" : "text-white"
                          }`}>
                            {session.name}
                          </p>
                          <p className={`text-xs mt-1 ${
                            isSelected ? "text-neutral-500" : "text-white/60"
                          }`}>
                            {getDayName(session.dayOfWeek)} · {session.startTime}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-sm font-bold ${
                            isSelected ? "text-navy" : "text-white"
                          }`}>
                            {formatPrice(session.price)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                              session.availabilityStatus === "full"
                                ? "bg-red-100 text-red-700"
                                : session.availabilityStatus === "limited"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {session.availabilityStatus === "full"
                              ? "Full"
                              : session.availabilityStatus === "limited"
                                ? `${session.spotsLeft} left`
                                : "Open"}
                          </span>
                        </div>
                      </div>
                      {inCart && (
                        <div className={`mt-2 flex items-center gap-1 text-xs ${
                          isSelected ? "text-emerald-600" : "text-emerald-300"
                        }`}>
                          <Check className="w-3 h-3" />
                          In cart
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Right: Calendar + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar View - Hidden on mobile */}
              <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">
                  Weekly Schedule
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {/* Day Headers */}
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div
                      key={day}
                      className="text-center py-2 text-xs font-bold uppercase text-white/40"
                    >
                      {getDayName(day).slice(0, 3)}
                    </div>
                  ))}

                  {/* Day Content */}
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div
                      key={`content-${day}`}
                      className="min-h-[80px] bg-white/5 rounded-lg p-1"
                    >
                      {sessionsByDay[day]?.map((session) => {
                        const isSelected = selectedSession?.id === session.id;
                        const inCart = isInCart(session.id);

                        return (
                          <motion.button
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full mb-1 p-1.5 text-left text-[10px] rounded transition-all ${
                              isSelected
                                ? "bg-white text-navy shadow-md"
                                : inCart
                                  ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                                  : session.availabilityStatus === "full"
                                    ? "bg-white/5 text-white/40"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                            }`}
                          >
                            <p className="font-bold truncate">{session.name}</p>
                            <p className="opacity-70">{session.startTime}</p>
                          </motion.button>
                        );
                      })}
                      {!sessionsByDay[day]?.length && (
                        <p className="text-[10px] text-white/20 text-center mt-6">—</p>
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
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-bold uppercase rounded-full mb-3 ${
                            selectedSession.availabilityStatus === "full"
                              ? "bg-red-100 text-red-700"
                              : selectedSession.availabilityStatus === "limited"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {selectedSession.availabilityStatus === "full"
                            ? "Full - Waitlist Available"
                            : selectedSession.availabilityStatus === "limited"
                              ? `Only ${selectedSession.spotsLeft} spots left`
                              : "Available"}
                        </span>
                        <h3 className="text-xl font-bold text-foreground">
                          {selectedSession.name}
                        </h3>
                        {selectedSession.program && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {selectedSession.program.name}
                          </p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-navy">
                        {formatPrice(selectedSession.price)}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mt-6">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 rounded-lg bg-sky/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-navy" />
                        </div>
                        <div>
                          <p className="text-neutral-500">Day</p>
                          <p className="font-bold text-foreground">{getDayName(selectedSession.dayOfWeek)}s</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 rounded-lg bg-sky/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-navy" />
                        </div>
                        <div>
                          <p className="text-neutral-500">Time</p>
                          <p className="font-bold text-foreground">{selectedSession.startTime} - {selectedSession.endTime}</p>
                        </div>
                      </div>
                      {selectedSession.program && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-10 w-10 rounded-lg bg-sky/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-navy" />
                          </div>
                          <div>
                            <p className="text-neutral-500">Location</p>
                            <p className="font-bold text-foreground">{getLocationName(selectedSession.program.location)}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 rounded-lg bg-sky/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-navy" />
                        </div>
                        <div>
                          <p className="text-neutral-500">Ages</p>
                          <p className="font-bold text-foreground">{selectedSession.ageMin} - {selectedSession.ageMax} years</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => handleAddToCart(selectedSession)}
                          disabled={selectedSession.availabilityStatus === "full"}
                          variant={isInCart(selectedSession.id) ? "secondary" : "primary"}
                          size="lg"
                          className="w-full"
                        >
                          {isInCart(selectedSession.id) ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Added to Cart
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </motion.div>
                      <Button asChild variant="outline" size="lg">
                        <Link href="/sessions">
                          View All
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
