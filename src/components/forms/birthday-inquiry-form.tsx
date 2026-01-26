"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, CheckCircle, AlertCircle, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTY_OPTIONS, LOCATIONS } from "@/lib/constants";
import {
  validateBirthdayForm,
  getFieldError,
  ValidationError,
} from "@/lib/validation";

export function BirthdayInquiryForm() {
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
    childName: "",
    childAge: "",
    partyDate: "",
    partyTime: "",
    venueType: "",
    location: "",
    guestCount: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors([]);

    // Client-side validation
    const validation = validateBirthdayForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError("Please fix the errors below");
      const firstErrorField = document.querySelector('[data-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "birthday-inquiry",
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send inquiry");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="mt-6 text-2xl font-bold">Inquiry Sent!</h3>
        <p className="mt-4 text-neutral-600 max-w-md mx-auto">
          Thanks for your interest! We&apos;ll be in touch within 24 hours to
          discuss {formData.childName}&apos;s birthday party.
        </p>
        <Button
          onClick={() => {
            setSuccess(false);
            setFormData({
              parentName: "",
              email: "",
              phone: "",
              childName: "",
              childAge: "",
              partyDate: "",
              partyTime: "",
              venueType: "",
              location: "",
              guestCount: "",
              message: "",
            });
          }}
          className="mt-8"
          variant="secondary"
        >
          Submit Another Inquiry
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-black text-white p-6 flex items-center gap-4">
        <PartyPopper className="h-8 w-8" />
        <div>
          <h3 className="font-bold text-lg">Party Inquiry Form</h3>
          <p className="text-neutral-400 text-sm">
            Fill in the details and we&apos;ll create a custom quote
          </p>
        </div>
      </div>

      {/* Parent Details */}
      <div className="space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500">
          Your Details
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-error={!!getFieldError(fieldErrors, "parentName")}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              value={formData.parentName}
              onChange={(e) =>
                setFormData({ ...formData, parentName: e.target.value })
              }
              className={`w-full border px-4 py-3 focus:outline-none ${
                getFieldError(fieldErrors, "parentName")
                  ? "border-red-500 bg-red-50"
                  : "border-neutral-300 focus:border-black"
              }`}
            />
            {getFieldError(fieldErrors, "parentName") && (
              <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "parentName")}</p>
            )}
          </div>
          <div data-error={!!getFieldError(fieldErrors, "email")}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`w-full border px-4 py-3 focus:outline-none ${
                getFieldError(fieldErrors, "email")
                  ? "border-red-500 bg-red-50"
                  : "border-neutral-300 focus:border-black"
              }`}
            />
            {getFieldError(fieldErrors, "email") && (
              <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "email")}</p>
            )}
          </div>
        </div>
        <div data-error={!!getFieldError(fieldErrors, "phone")}>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className={`w-full border px-4 py-3 focus:outline-none ${
              getFieldError(fieldErrors, "phone")
                ? "border-red-500 bg-red-50"
                : "border-neutral-300 focus:border-black"
            }`}
          />
          {getFieldError(fieldErrors, "phone") && (
            <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "phone")}</p>
          )}
        </div>
      </div>

      {/* Birthday Child Details */}
      <div className="space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500">
          Birthday Child
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-error={!!getFieldError(fieldErrors, "childName")}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Child&apos;s Name *
            </label>
            <input
              type="text"
              value={formData.childName}
              onChange={(e) =>
                setFormData({ ...formData, childName: e.target.value })
              }
              className={`w-full border px-4 py-3 focus:outline-none ${
                getFieldError(fieldErrors, "childName")
                  ? "border-red-500 bg-red-50"
                  : "border-neutral-300 focus:border-black"
              }`}
            />
            {getFieldError(fieldErrors, "childName") && (
              <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "childName")}</p>
            )}
          </div>
          <div data-error={!!getFieldError(fieldErrors, "childAge")}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Age (turning) *
            </label>
            <input
              type="number"
              min="4"
              max="12"
              value={formData.childAge}
              onChange={(e) =>
                setFormData({ ...formData, childAge: e.target.value })
              }
              className={`w-full border px-4 py-3 focus:outline-none ${
                getFieldError(fieldErrors, "childAge")
                  ? "border-red-500 bg-red-50"
                  : "border-neutral-300 focus:border-black"
              }`}
              placeholder="e.g., 7"
            />
            {getFieldError(fieldErrors, "childAge") && (
              <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "childAge")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Party Details */}
      <div className="space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500">
          Party Details
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-error={!!getFieldError(fieldErrors, "partyDate")}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              value={formData.partyDate}
              onChange={(e) =>
                setFormData({ ...formData, partyDate: e.target.value })
              }
              className={`w-full border px-4 py-3 focus:outline-none ${
                getFieldError(fieldErrors, "partyDate")
                  ? "border-red-500 bg-red-50"
                  : "border-neutral-300 focus:border-black"
              }`}
            />
            {getFieldError(fieldErrors, "partyDate") && (
              <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "partyDate")}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Preferred Time
            </label>
            <select
              value={formData.partyTime}
              onChange={(e) =>
                setFormData({ ...formData, partyTime: e.target.value })
              }
              className="w-full border border-neutral-300 px-4 py-3 focus:border-black focus:outline-none"
            >
              <option value="">Select a time</option>
              <option value="morning">Morning (9am-12pm)</option>
              <option value="afternoon">Afternoon (1pm-4pm)</option>
              <option value="late-afternoon">Late Afternoon (3pm-6pm)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div data-error={!!getFieldError(fieldErrors, "venueType")}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Venue Type *
            </label>
            <select
              value={formData.venueType}
              onChange={(e) =>
                setFormData({ ...formData, venueType: e.target.value })
              }
              className={`w-full border px-4 py-3 focus:outline-none ${
                getFieldError(fieldErrors, "venueType")
                  ? "border-red-500 bg-red-50"
                  : "border-neutral-300 focus:border-black"
              }`}
            >
              <option value="">Select venue type</option>
              {PARTY_OPTIONS.venueTypes.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            {getFieldError(fieldErrors, "venueType") && (
              <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "venueType")}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Preferred Location
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full border border-neutral-300 px-4 py-3 focus:border-black focus:outline-none"
            >
              <option value="">Select location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
              <option value="other">Other / My Own Venue</option>
            </select>
          </div>
        </div>

        <div data-error={!!getFieldError(fieldErrors, "guestCount")}>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Estimated Number of Guests *
          </label>
          <input
            type="number"
            min={PARTY_OPTIONS.minChildren}
            max={PARTY_OPTIONS.maxChildren}
            value={formData.guestCount}
            onChange={(e) =>
              setFormData({ ...formData, guestCount: e.target.value })
            }
            className={`w-full border px-4 py-3 focus:outline-none ${
              getFieldError(fieldErrors, "guestCount")
                ? "border-red-500 bg-red-50"
                : "border-neutral-300 focus:border-black"
            }`}
            placeholder={`${PARTY_OPTIONS.minChildren}-${PARTY_OPTIONS.maxChildren} children`}
          />
          {getFieldError(fieldErrors, "guestCount") ? (
            <p className="text-xs text-red-600 mt-1">{getFieldError(fieldErrors, "guestCount")}</p>
          ) : (
            <p className="mt-1 text-xs text-neutral-500">
              Min {PARTY_OPTIONS.minChildren}, max {PARTY_OPTIONS.maxChildren}{" "}
              children
            </p>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Anything else we should know?
        </label>
        <textarea
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          rows={4}
          className="w-full border border-neutral-300 px-4 py-3 focus:border-black focus:outline-none resize-none"
          placeholder="Special requests, themes, dietary requirements..."
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Party Inquiry"
        )}
      </Button>

      <p className="text-xs text-neutral-500 text-center">
        We&apos;ll get back to you within 24 hours with availability and a
        custom quote.
      </p>
    </form>
  );
}
