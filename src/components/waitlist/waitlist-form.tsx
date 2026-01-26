"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGE_GROUPS } from "@/lib/constants";
import {
  validateWaitlistForm,
  getFieldError,
  ValidationError,
} from "@/lib/validation";

interface WaitlistFormProps {
  session: {
    id: string;
    name: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    ageMin: number;
    ageMax: number;
    program?: {
      name: string;
    } | null;
  };
  onClose: () => void;
}

export function WaitlistForm({ session, onClose }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    childFirstName: "",
    childLastName: "",
    ageGroup: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState<{ position: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors([]);

    // Client-side validation
    const validation = validateWaitlistForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError("Please fix the errors below");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setSuccess({ position: data.data.position });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join waitlist");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day];
  };

  // Filter age groups based on session's age range
  const filteredAgeGroups = AGE_GROUPS.filter((group) => {
    const ages = group.ageRange.split("-");
    const groupMinAge = parseInt(ages[0]);
    const groupMaxAge = parseInt(ages[1] || ages[0]);
    return groupMinAge <= session.ageMax && groupMaxAge >= session.ageMin;
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-black p-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold uppercase text-white">
                Join Waitlist
              </h2>
              <p className="text-sm text-neutral-400">{session.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Session Info */}
          <div className="p-4 bg-neutral-100 border-b border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Users className="h-4 w-4" />
              <span>
                {getDayName(session.dayOfWeek)} {session.startTime} -{" "}
                {session.endTime}
              </span>
            </div>
            {session.program && (
              <p className="text-sm text-neutral-500 mt-1">
                {session.program.name}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-bold text-lg mt-4">
                  You&apos;re on the waitlist!
                </h3>
                <p className="text-neutral-600 mt-2">
                  Your position: <span className="font-bold">#{success.position}</span>
                </p>
                <p className="text-sm text-neutral-500 mt-4">
                  We&apos;ll email you at{" "}
                  <span className="font-medium">{formData.parentEmail}</span>{" "}
                  when a spot becomes available.
                </p>
                <Button onClick={onClose} className="mt-6">
                  Close
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm border border-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Child Details */}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-3">
                    Child Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.childFirstName}
                        onChange={(e) =>
                          setFormData({ ...formData, childFirstName: e.target.value })
                        }
                        className={`w-full border px-3 py-2 text-sm focus:outline-none ${
                          getFieldError(fieldErrors, "childFirstName")
                            ? "border-red-500 bg-red-50"
                            : "border-neutral-300 focus:border-black"
                        }`}
                      />
                      {getFieldError(fieldErrors, "childFirstName") && (
                        <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "childFirstName")}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.childLastName}
                        onChange={(e) =>
                          setFormData({ ...formData, childLastName: e.target.value })
                        }
                        className={`w-full border px-3 py-2 text-sm focus:outline-none ${
                          getFieldError(fieldErrors, "childLastName")
                            ? "border-red-500 bg-red-50"
                            : "border-neutral-300 focus:border-black"
                        }`}
                      />
                      {getFieldError(fieldErrors, "childLastName") && (
                        <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "childLastName")}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Age Group
                    </label>
                    <select
                      value={formData.ageGroup}
                      onChange={(e) =>
                        setFormData({ ...formData, ageGroup: e.target.value })
                      }
                      className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    >
                      <option value="">Select age group</option>
                      {filteredAgeGroups.map((group) => (
                        <option key={group.id} value={group.ageRange}>
                          {group.name} ({group.ageRange} years)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Parent/Guardian Details */}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-3">
                    Parent/Guardian Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.parentFirstName}
                        onChange={(e) =>
                          setFormData({ ...formData, parentFirstName: e.target.value })
                        }
                        className={`w-full border px-3 py-2 text-sm focus:outline-none ${
                          getFieldError(fieldErrors, "parentFirstName")
                            ? "border-red-500 bg-red-50"
                            : "border-neutral-300 focus:border-black"
                        }`}
                      />
                      {getFieldError(fieldErrors, "parentFirstName") && (
                        <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentFirstName")}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.parentLastName}
                        onChange={(e) =>
                          setFormData({ ...formData, parentLastName: e.target.value })
                        }
                        className={`w-full border px-3 py-2 text-sm focus:outline-none ${
                          getFieldError(fieldErrors, "parentLastName")
                            ? "border-red-500 bg-red-50"
                            : "border-neutral-300 focus:border-black"
                        }`}
                      />
                      {getFieldError(fieldErrors, "parentLastName") && (
                        <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentLastName")}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, parentEmail: e.target.value })
                      }
                      className={`w-full border px-3 py-2 text-sm focus:outline-none ${
                        getFieldError(fieldErrors, "parentEmail")
                          ? "border-red-500 bg-red-50"
                          : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {getFieldError(fieldErrors, "parentEmail") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentEmail")}</p>
                    )}
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, parentPhone: e.target.value })
                      }
                      className={`w-full border px-3 py-2 text-sm focus:outline-none ${
                        getFieldError(fieldErrors, "parentPhone")
                          ? "border-red-500 bg-red-50"
                          : "border-neutral-300 focus:border-black"
                      }`}
                      placeholder="Optional"
                    />
                    {getFieldError(fieldErrors, "parentPhone") && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentPhone")}</p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <p className="text-xs text-neutral-500">
                  By joining the waitlist, you agree to be contacted when a spot
                  becomes available. We&apos;ll notify you via email.
                </p>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Waitlist"
                  )}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
