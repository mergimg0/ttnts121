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

  // Simple status text
  const getStatusText = (session: SessionData) => {
    if (session.availabilityStatus === "full") return "Full";
    if (session.availabilityStatus === "limited") return `${session.spotsLeft} spots`;
    return "Available";
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
            {/* Mobile: Self-contained session cards */}
            <div className="md:hidden space-y-3">
              {sessions.map((session) => {
                const inCart = isInCart(session.id);
                const isFull = session.availabilityStatus === "full";

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-xl p-5 ${isFull ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{session.name}</h3>
                        {session.program && (
                          <p className="text-sm text-neutral-500 mt-0.5">{session.program.name}</p>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-navy">{formatPrice(session.price)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        <span>{getDayName(session.dayOfWeek)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span>{session.startTime}</span>
                      </div>
                      {session.program && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-neutral-400" />
                          <span>{getLocationName(session.program.location)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span>Ages {session.ageMin}–{session.ageMax}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <p className={`text-sm ${
                        isFull ? "text-neutral-400" : "text-neutral-500"
                      }`}>
                        {getStatusText(session)}
                      </p>
                      <Button
                        onClick={() => handleAddToCart(session)}
                        disabled={isFull}
                        variant={inCart ? "secondary" : "primary"}
                        size="sm"
                      >
                        {inCart ? (
                          <>
                            <Check className="mr-1.5 h-4 w-4" />
                            Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-1.5 h-4 w-4" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4">
                <Button asChild variant="outline" size="lg" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/sessions">
                    View All Sessions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Desktop: 3-column layout with calendar */}
            <div className="hidden md:grid gap-6 lg:grid-cols-3">
              {/* Left: Sessions List */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium tracking-wide text-white/40 mb-4">
                  Available Sessions
                </h3>
                <div className="space-y-2 lg:max-h-[400px] lg:overflow-y-auto lg:pr-2">
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
                            ? "bg-white text-navy border-white"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        } ${isFull && !isSelected ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isSelected ? "text-navy" : "text-white"}`}>
                              {session.name}
                            </p>
                            <p className={`text-xs mt-1 ${isSelected ? "text-neutral-500" : "text-white/50"}`}>
                              {getDayName(session.dayOfWeek)} · {session.startTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${isSelected ? "text-navy" : "text-white"}`}>
                              {formatPrice(session.price)}
                            </p>
                            <p className={`text-xs mt-0.5 ${
                              isSelected
                                ? isFull ? "text-neutral-400" : "text-neutral-500"
                                : isFull ? "text-white/30" : "text-white/50"
                            }`}>
                              {getStatusText(session)}
                            </p>
                          </div>
                        </div>
                        {inCart && (
                          <p className={`mt-2 text-xs flex items-center gap-1 ${
                            isSelected ? "text-navy/60" : "text-white/50"
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
                {/* Calendar View */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-medium tracking-wide text-white/40 mb-4">
                    Weekly Schedule
                  </h3>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <div key={day} className="text-center py-2 text-[11px] font-medium text-white/30">
                        {getDayName(day).slice(0, 3)}
                      </div>
                    ))}

                    {/* Day Content */}
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <div key={`content-${day}`} className="min-h-[80px] bg-white/5 rounded-lg p-1">
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
                                  ? "bg-white text-navy"
                                  : inCart
                                    ? "bg-white/20 text-white"
                                    : isFull
                                      ? "bg-white/5 text-white/30"
                                      : "bg-white/10 hover:bg-white/15 text-white"
                              }`}
                            >
                              <p className="font-medium truncate">{session.name}</p>
                              <p className="opacity-60">{session.startTime}</p>
                            </button>
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
                      className="bg-white rounded-xl p-6"
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

                      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-100">
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

                      <div className="mt-6 flex gap-3">
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
          </>
        )}
      </Container>
    </section>
  );
}
