"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Calendar,
  Mail,
  CreditCard,
  PartyPopper,
} from "lucide-react";
import {
  LOCATIONS,
  SESSION_TYPES,
  AGE_GROUPS,
  PAYMENT_OPTIONS,
  SITE_CONFIG,
} from "@/lib/constants";

type Step = "session" | "child" | "parent" | "payment" | "confirm" | "success";

export default function BookingPage() {
  const [step, setStep] = useState<Step>("session");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Session
    sessionType: "",
    location: "",
    ageGroup: "",
    // Child
    childFirstName: "",
    childLastName: "",
    childDob: "",
    medicalInfo: "",
    // Parent
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    emergencyContact: "",
    emergencyPhone: "",
    // Payment
    paymentMethod: "",
    // Consent
    photoConsent: false,
    termsAccepted: false,
  });

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const steps: { id: Step; label: string }[] = [
    { id: "session", label: "Session" },
    { id: "child", label: "Child" },
    { id: "parent", label: "Parent" },
    { id: "payment", label: "Payment" },
    { id: "confirm", label: "Confirm" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking");
      }

      setBookingRef(data.bookingRef);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-black py-12 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Book Your Child&apos;s <span className="text-neutral-500">First Session</span>
            </h1>
            <p className="mt-4 text-neutral-400">
              2 minutes to complete. No payment required now.
              <br />
              <span className="text-neutral-500">Full refund if they don&apos;t love it.</span>
            </p>
          </div>
        </Container>
      </section>

      {/* Progress Steps */}
      {step !== "success" && (
        <section className="border-b border-neutral-200 bg-white py-4">
          <Container>
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                      index === currentStepIndex
                        ? "bg-black text-white"
                        : index < currentStepIndex
                          ? "bg-[#2E3192]/10 text-[#2E3192]"
                          : "text-neutral-400"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle className="h-4 w-4 text-[#2E3192]" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center border border-current text-xs">
                        {index + 1}
                      </span>
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mx-2 h-px w-8 bg-neutral-200" />
                  )}
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Form */}
      <section className="py-12 sm:py-16 bg-neutral-50">
        <Container>
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-2xl border border-neutral-200 bg-white p-6 sm:p-10"
          >
            {/* Step 1: Session Selection */}
            {step === "session" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                    Choose Your Session
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Select the type of session and location that suits your
                    family.
                  </p>
                </div>

                {/* Session Type */}
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Session Type *
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {SESSION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateFormData("sessionType", type.id)}
                        className={`border-2 p-4 text-left transition-all ${
                          formData.sessionType === type.id
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <p className="font-bold uppercase tracking-wide">
                          {type.name}
                        </p>
                        <p className={`mt-1 text-sm ${formData.sessionType === type.id ? "text-neutral-300" : "text-neutral-500"}`}>
                          From £{type.priceFrom}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Location *
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => updateFormData("location", loc.id)}
                        className={`border-2 p-4 text-left transition-all ${
                          formData.location === loc.id
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <p className="font-bold uppercase tracking-wide">{loc.name}</p>
                        <p className={`mt-1 text-sm ${formData.location === loc.id ? "text-neutral-300" : "text-neutral-500"}`}>
                          {loc.postcode}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Group */}
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Age Group *
                  </label>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {AGE_GROUPS.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => updateFormData("ageGroup", group.id)}
                        className={`border-2 p-4 text-center transition-all ${
                          formData.ageGroup === group.id
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <p className="font-bold uppercase tracking-wide">
                          {group.name}
                        </p>
                        <p className={`text-sm ${formData.ageGroup === group.id ? "text-neutral-300" : "text-neutral-500"}`}>
                          Ages {group.ageRange}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Child Details */}
            {step === "child" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                    Child&apos;s Details
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Tell us about your child so we can provide the best
                    experience.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="childFirstName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                    >
                      First Name *
                    </label>
                    <Input
                      id="childFirstName"
                      value={formData.childFirstName}
                      onChange={(e) =>
                        updateFormData("childFirstName", e.target.value)
                      }
                      required
                      className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="childLastName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                    >
                      Last Name *
                    </label>
                    <Input
                      id="childLastName"
                      value={formData.childLastName}
                      onChange={(e) =>
                        updateFormData("childLastName", e.target.value)
                      }
                      required
                      className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="childDob"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Date of Birth *
                  </label>
                  <Input
                    id="childDob"
                    type="date"
                    value={formData.childDob}
                    onChange={(e) => updateFormData("childDob", e.target.value)}
                    required
                    className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="medicalInfo"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Medical Information / Allergies
                  </label>
                  <Textarea
                    id="medicalInfo"
                    value={formData.medicalInfo}
                    onChange={(e) =>
                      updateFormData("medicalInfo", e.target.value)
                    }
                    rows={3}
                    className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    placeholder="Please list any medical conditions, allergies, or special requirements we should be aware of..."
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    This information helps us keep your child safe during
                    sessions.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Parent Details */}
            {step === "parent" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                    Parent/Guardian Details
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    We&apos;ll use these details to confirm bookings and send
                    updates.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="parentFirstName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                    >
                      First Name *
                    </label>
                    <Input
                      id="parentFirstName"
                      value={formData.parentFirstName}
                      onChange={(e) =>
                        updateFormData("parentFirstName", e.target.value)
                      }
                      required
                      className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="parentLastName"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                    >
                      Last Name *
                    </label>
                    <Input
                      id="parentLastName"
                      value={formData.parentLastName}
                      onChange={(e) =>
                        updateFormData("parentLastName", e.target.value)
                      }
                      required
                      className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="parentEmail"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Email Address *
                  </label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) =>
                      updateFormData("parentEmail", e.target.value)
                    }
                    required
                    className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="parentPhone"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Phone Number *
                  </label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) =>
                      updateFormData("parentPhone", e.target.value)
                    }
                    required
                    className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="mb-4 font-bold uppercase tracking-wide text-black">
                    Emergency Contact
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="emergencyContact"
                        className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                      >
                        Contact Name *
                      </label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) =>
                          updateFormData("emergencyContact", e.target.value)
                        }
                        required
                        className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                        placeholder="If different from above"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="emergencyPhone"
                        className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
                      >
                        Contact Phone *
                      </label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) =>
                          updateFormData("emergencyPhone", e.target.value)
                        }
                        required
                        className="mt-2 rounded-none border-neutral-300 focus:border-black focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === "payment" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                    Payment Method
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Choose how you&apos;d like to pay for sessions.
                  </p>
                </div>

                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateFormData("paymentMethod", option.id)}
                      className={`w-full border-2 p-4 text-left transition-all ${
                        formData.paymentMethod === option.id
                          ? "border-black bg-black text-white"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <p className="font-bold uppercase tracking-wide">
                        {option.name}
                      </p>
                      <p className={`mt-1 text-sm ${formData.paymentMethod === option.id ? "text-neutral-300" : "text-neutral-500"}`}>
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-600">
                    <strong>Note:</strong> Payment details will be sent to you
                    via email after your booking is confirmed. No payment is
                    taken at this stage.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Confirm */}
            {step === "confirm" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                    Confirm Your Booking
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Please review your details and accept the terms to complete
                    your registration.
                  </p>
                </div>

                {/* Summary */}
                <div className="border border-neutral-200 bg-neutral-50 p-6">
                  <h3 className="font-bold uppercase tracking-wide text-black">
                    Booking Summary
                  </h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Session:</dt>
                      <dd className="font-bold text-black">
                        {SESSION_TYPES.find(
                          (s) => s.id === formData.sessionType
                        )?.name || "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Location:</dt>
                      <dd className="font-bold text-black">
                        {LOCATIONS.find((l) => l.id === formData.location)
                          ?.name || "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Age Group:</dt>
                      <dd className="font-bold text-black">
                        {AGE_GROUPS.find((a) => a.id === formData.ageGroup)
                          ?.name || "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Child:</dt>
                      <dd className="font-bold text-black">
                        {formData.childFirstName} {formData.childLastName}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <dt className="text-neutral-600">Parent:</dt>
                      <dd className="font-bold text-black">
                        {formData.parentFirstName} {formData.parentLastName}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-600">Payment:</dt>
                      <dd className="font-bold text-black">
                        {PAYMENT_OPTIONS.find(
                          (p) => p.id === formData.paymentMethod
                        )?.name || "-"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Consents */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="photoConsent"
                      checked={formData.photoConsent}
                      onChange={(e) =>
                        updateFormData("photoConsent", e.target.checked)
                      }
                      className="mt-1 h-4 w-4 border-neutral-300 text-black focus:ring-black"
                    />
                    <label
                      htmlFor="photoConsent"
                      className="text-sm text-neutral-600"
                    >
                      I consent to photos/videos of my child being taken during
                      sessions and used on social media/website for promotional
                      purposes.
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={(e) =>
                        updateFormData("termsAccepted", e.target.checked)
                      }
                      required
                      className="mt-1 h-4 w-4 border-neutral-300 text-black focus:ring-black"
                    />
                    <label
                      htmlFor="termsAccepted"
                      className="text-sm text-neutral-600"
                    >
                      I confirm that the information provided is accurate and I
                      accept the terms and conditions. I understand that payment
                      will be requested after booking confirmation. *
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="border-2 border-red-500 bg-red-50 p-4 text-red-700">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            {step !== "success" && (
              <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-6">
                {currentStepIndex > 0 ? (
                  <Button type="button" variant="secondary" onClick={prevStep} disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStepIndex < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!formData.termsAccepted || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Booking
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </form>

          {/* Success Screen */}
          {step === "success" && (
            <div className="mx-auto max-w-2xl border border-neutral-200 bg-white p-8">
              <div className="text-center">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center border-2 border-[#F5A623]">
                  <PartyPopper className="h-10 w-10 text-[#F5A623]" />
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-wide text-black">
                  You&apos;re All Set!
                </h2>
                <p className="mt-4 text-neutral-600">
                  {formData.childFirstName} is registered for football sessions.
                  <br />
                  <span className="font-semibold text-black">Get ready for some big smiles!</span>
                </p>

                {bookingRef && (
                  <div className="mt-8 border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500 uppercase tracking-wider">Your booking reference:</p>
                    <p className="text-2xl font-black text-black">{bookingRef}</p>
                  </div>
                )}
              </div>

              {/* What Happens Next - Enhanced */}
              <div className="mt-10 border-t border-neutral-200 pt-8">
                <h3 className="font-bold uppercase tracking-wide text-black text-center mb-8">
                  What Happens Next
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-black">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-black">Check Your Email (Next 24 Hours)</p>
                      <p className="text-sm text-neutral-600">
                        We&apos;ll send confirmation with session dates, times, and venue details.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-black">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-black">Payment Details</p>
                      <p className="text-sm text-neutral-600">
                        Payment instructions will be in your confirmation email. No payment was taken today.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-black">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-black">First Session Day</p>
                      <p className="text-sm text-neutral-600">
                        Bring football boots or trainers, shin pads, water bottle, and comfortable clothes.
                        Arrive 10 minutes early so {formData.childFirstName} can meet their coach!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reassurance */}
              <div className="mt-8 border border-[#2E3192]/20 bg-[#2E3192]/5 p-4 text-center">
                <p className="text-sm text-neutral-700">
                  <span className="font-semibold">Remember:</span> If {formData.childFirstName} doesn&apos;t love their first session,
                  you get a full refund. No questions asked.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild>
                  <Link href="/">Return Home</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/sessions">View All Sessions</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Help */}
          {step !== "success" && (
            <div className="mx-auto mt-8 max-w-2xl text-center">
              <p className="text-sm text-neutral-500">
                Need help? Contact us at{" "}
                <a
                  href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                  className="text-black hover:underline"
                >
                  {SITE_CONFIG.phone}
                </a>{" "}
                or{" "}
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="text-black hover:underline"
                >
                  {SITE_CONFIG.email}
                </a>
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
