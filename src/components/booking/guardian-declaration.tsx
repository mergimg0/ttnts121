"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ShieldCheck, AlertCircle } from "lucide-react";

interface GuardianDeclarationProps {
  onAccept: (accepted: boolean, signature: string) => void;
  childrenNames: string[];
  error?: string;
}

export function GuardianDeclaration({
  onAccept,
  childrenNames,
  error,
}: GuardianDeclarationProps) {
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState("");

  // Notify parent component when acceptance state changes
  useEffect(() => {
    onAccept(accepted && signature.trim().length > 0, signature.trim());
  }, [accepted, signature, onAccept]);

  // Format children names for display
  const formattedNames =
    childrenNames.length === 0
      ? "the child/children listed above"
      : childrenNames.length === 1
        ? childrenNames[0]
        : childrenNames.slice(0, -1).join(", ") +
          " and " +
          childrenNames[childrenNames.length - 1];

  return (
    <div
      className={`border bg-white p-6 ${error ? "border-red-300 bg-red-50/50" : "border-neutral-200"}`}
    >
      <h2 className="font-bold uppercase tracking-wide text-black mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5" />
        Guardian Declaration
      </h2>

      <div className="space-y-4">
        {/* Checkbox with legal text */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="guardian-declaration"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-5 w-5 border-2 border-neutral-300 rounded focus:ring-black focus:ring-offset-0"
          />
          <label
            htmlFor="guardian-declaration"
            className="text-sm text-neutral-700 leading-relaxed"
          >
            I confirm that I am the parent/legal guardian of{" "}
            <strong className="text-black">{formattedNames}</strong> and have
            the authority to make this booking on their behalf. I accept
            responsibility for ensuring the information provided is accurate and
            for the child&apos;s participation in the sessions booked.
          </label>
        </div>

        {/* Digital signature field */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Digital Signature (Type your full name) *
          </label>
          <Input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name as signature"
            className={`rounded-none ${!accepted ? "bg-neutral-50 text-neutral-400" : ""}`}
            disabled={!accepted}
          />
          {accepted && signature.trim().length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Please type your full name to complete the declaration
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Timestamp notice */}
        {accepted && signature.trim().length > 0 && (
          <p className="text-xs text-neutral-500 mt-2">
            By proceeding to payment, this declaration will be timestamped and
            stored with your booking record.
          </p>
        )}
      </div>
    </div>
  );
}
