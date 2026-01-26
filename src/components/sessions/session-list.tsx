"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShoppingCart,
  Check,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { Session } from "@/types/booking";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import { LOCATIONS } from "@/lib/constants";

interface SessionWithProgram extends Session {
  program: {
    id: string;
    name: string;
    location: string;
    serviceType: string;
  } | null;
  spotsLeft: number;
  availabilityStatus: "available" | "limited" | "full";
}

interface SessionListProps {
  serviceType: string;
  title?: string;
  subtitle?: string;
  maxSessions?: number;
  showViewAll?: boolean;
}

export function SessionList({
  serviceType,
  title = "Available Sessions",
  subtitle,
  maxSessions = 6,
  showViewAll = true,
}: SessionListProps) {
  const [sessions, setSessions] = useState<SessionWithProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waitlistSession, setWaitlistSession] = useState<SessionWithProgram | null>(null);

  const { addItem, removeItem, isInCart } = useCart();

  useEffect(() => {
    fetchSessions();
  }, [serviceType]);

  const fetchSessions = async () => {
    setError(null);
    try {
      const response = await fetch(`/api/sessions?serviceType=${serviceType}`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data.slice(0, maxSessions));
      } else {
        setError("Failed to load sessions");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Unable to load sessions. Please try again.");
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

  const getLocationName = (id: string) => {
    return LOCATIONS.find((l) => l.id === id)?.name || id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-400 text-4xl">⚠️</div>
        <h3 className="mt-4 font-bold text-black">Unable to load sessions</h3>
        <p className="mt-2 text-neutral-500">{error}</p>
        <Button
          onClick={() => {
            setLoading(true);
            fetchSessions();
          }}
          className="mt-6"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
        <h3 className="mt-4 font-bold text-black">No sessions available</h3>
        <p className="mt-2 text-neutral-500">
          Check back soon for new sessions or contact us for availability.
        </p>
        <Button asChild className="mt-6">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
            {title.split(" ").slice(0, -1).join(" ")}
            <br />
            <span className="text-neutral-400">{title.split(" ").slice(-1)}</span>
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-neutral-600">{subtitle}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-neutral-200 bg-white p-6 hover:border-black transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-black">{session.name}</h3>
                {session.program && (
                  <p className="text-sm text-neutral-500">{session.program.name}</p>
                )}
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase ${
                  session.availabilityStatus === "full"
                    ? "bg-red-100 text-red-700"
                    : session.availabilityStatus === "limited"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {session.availabilityStatus === "full"
                  ? "Full"
                  : session.availabilityStatus === "limited"
                    ? `${session.spotsLeft} left`
                    : "Available"}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{getDayName(session.dayOfWeek)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {session.startTime} - {session.endTime}
                </span>
              </div>
              {session.program && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{getLocationName(session.program.location)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  Ages {session.ageMin}-{session.ageMax}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-xl font-bold">{formatPrice(session.price)}</span>
              {session.availabilityStatus === "full" && session.waitlistEnabled ? (
                <Button
                  onClick={() => setWaitlistSession(session)}
                  variant="secondary"
                  size="sm"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Waitlist
                </Button>
              ) : (
                <Button
                  onClick={() => handleAddToCart(session)}
                  disabled={session.availabilityStatus === "full"}
                  variant={isInCart(session.id) ? "secondary" : "primary"}
                  size="sm"
                >
                  {isInCart(session.id) ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      In Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {showViewAll && sessions.length >= maxSessions && (
        <div className="mt-8 text-center">
          <Button asChild variant="secondary">
            <Link href={`/sessions?serviceType=${serviceType}`}>
              View All Sessions
            </Link>
          </Button>
        </div>
      )}

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
