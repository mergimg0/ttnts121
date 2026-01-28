"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

interface TransferSession {
  id: string;
  name: string;
  description?: string;
  programId: string;
  programName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: Date | Timestamp;
  location: string;
  ageMin: number;
  ageMax: number;
  price: number;
  spotsLeft: number;
  priceDifference: number;
}

interface CurrentSession {
  id: string;
  name: string;
  price: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
}

interface TransferSessionPickerProps {
  currentSession: CurrentSession;
  availableSessions: TransferSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
}

function formatDate(date: Date | Timestamp | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : (date as Timestamp).toDate?.() || new Date(date as unknown as string);
  return format(d, "MMM d, yyyy");
}

function PriceBadge({ priceDifference }: { priceDifference: number }) {
  if (priceDifference === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
        <Minus className="h-3 w-3" />
        Same price
      </span>
    );
  }

  if (priceDifference > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        <TrendingUp className="h-3 w-3" />
        +{"\u00A3"}{(priceDifference / 100).toFixed(2)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
      <TrendingDown className="h-3 w-3" />
      -{"\u00A3"}{(Math.abs(priceDifference) / 100).toFixed(2)} refund
    </span>
  );
}

export function TransferSessionPicker({
  currentSession,
  availableSessions,
  selectedSessionId,
  onSelectSession,
}: TransferSessionPickerProps) {
  const [filterDay, setFilterDay] = useState<number | null>(null);

  // Get unique days from available sessions
  const availableDays = [...new Set(availableSessions.map((s) => s.dayOfWeek))].sort();

  // Filter sessions
  const filteredSessions =
    filterDay !== null
      ? availableSessions.filter((s) => s.dayOfWeek === filterDay)
      : availableSessions;

  if (availableSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No other sessions available for transfer at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session Summary */}
      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
          Current Session
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-neutral-900">{currentSession.name}</p>
            <p className="text-sm text-neutral-600">
              {getDayName(currentSession.dayOfWeek)}, {currentSession.startTime} - {currentSession.endTime}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-neutral-900">
              {"\u00A3"}{(currentSession.price / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Arrow */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="h-px w-8 bg-neutral-300" />
          <ArrowRight className="h-5 w-5" />
          <div className="h-px w-8 bg-neutral-300" />
        </div>
      </div>

      {/* Day Filter */}
      {availableDays.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDay(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filterDay === null
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            All Days
          </button>
          {availableDays.map((day) => (
            <button
              key={day}
              onClick={() => setFilterDay(day)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filterDay === day
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {getDayName(day)}
            </button>
          ))}
        </div>
      )}

      {/* Available Sessions */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-700">
          Select new session ({filteredSessions.length} available)
        </p>

        <div className="space-y-2">
          {filteredSessions.map((session) => {
            const isSelected = selectedSessionId === session.id;

            return (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all",
                  isSelected
                    ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-neutral-900 truncate">
                        {session.name}
                      </p>
                      {isSelected && (
                        <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 mb-3">{session.programName}</p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        <span>{getDayName(session.dayOfWeek)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        <span className="truncate">{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span>{session.spotsLeft} spots left</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="font-semibold text-neutral-900">
                      {"\u00A3"}{(session.price / 100).toFixed(2)}
                    </p>
                    <PriceBadge priceDifference={session.priceDifference} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
