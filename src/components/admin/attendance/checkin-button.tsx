"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Loader2 } from "lucide-react";

interface CheckinButtonProps {
  bookingId: string;
  sessionId: string;
  childName: string;
  date: string;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  onSuccess: () => void;
}

export function CheckinButton({
  bookingId,
  sessionId,
  childName,
  date,
  isCheckedIn,
  isCheckedOut,
  onSuccess,
}: CheckinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          sessionId,
          childName,
          date,
          method: "manual",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to check in");
        return;
      }

      onSuccess();
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          sessionId,
          childName,
          date,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to check out");
        return;
      }

      onSuccess();
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Already checked out - no action available
  if (isCheckedOut) {
    return (
      <Button variant="adminSecondary" size="sm" disabled className="opacity-50">
        Complete
      </Button>
    );
  }

  // Checked in but not out - show checkout button
  if (isCheckedIn) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          variant="adminSecondary"
          size="sm"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="mr-1.5 h-4 w-4" />
              Check Out
            </>
          )}
        </Button>
        {error && <span className="text-[11px] text-red-500">{error}</span>}
      </div>
    );
  }

  // Not checked in - show checkin button
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="adminPrimary"
        size="sm"
        onClick={handleCheckin}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <LogIn className="mr-1.5 h-4 w-4" />
            Check In
          </>
        )}
      </Button>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}
