"use client";

import { useState, useCallback } from "react";
import { SignatureCanvas } from "@/components/admin/signature-canvas";
import { WaiverTemplate } from "@/types/waiver";
import { ChevronDown, ChevronUp, FileText, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaiverSignatureProps {
  waiver: WaiverTemplate;
  signerName: string;
  onSign: (waiverId: string, signatureData: string) => void;
  onUnsign: (waiverId: string) => void;
  isSigned: boolean;
  signatureData?: string;
  error?: string;
}

export function WaiverSignature({
  waiver,
  signerName,
  onSign,
  onUnsign,
  isSigned,
  signatureData,
  error,
}: WaiverSignatureProps) {
  const [isExpanded, setIsExpanded] = useState(!isSigned);
  const [agreed, setAgreed] = useState(isSigned);
  const [currentSignature, setCurrentSignature] = useState<string | null>(
    signatureData || null
  );

  const handleSignatureChange = useCallback((data: string | null) => {
    setCurrentSignature(data);
  }, []);

  const handleAgreeChange = (checked: boolean) => {
    setAgreed(checked);
    if (checked && currentSignature) {
      onSign(waiver.id, currentSignature);
    } else {
      onUnsign(waiver.id);
    }
  };

  const handleSignatureComplete = () => {
    if (agreed && currentSignature) {
      onSign(waiver.id, currentSignature);
    }
  };

  // When signature changes and agree is checked, auto-sign
  const handleSignatureUpdate = (data: string | null) => {
    handleSignatureChange(data);
    if (data && agreed) {
      onSign(waiver.id, data);
    } else if (!data) {
      onUnsign(waiver.id);
    }
  };

  return (
    <div
      className={cn(
        "border bg-white transition-colors",
        error
          ? "border-red-300 bg-red-50"
          : isSigned
            ? "border-green-200"
            : "border-neutral-200"
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isSigned ? "bg-green-100" : "bg-neutral-100"
            )}
          >
            {isSigned ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <FileText className="h-4 w-4 text-neutral-500" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-black">
              {waiver.name}
              {waiver.isRequired && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </h3>
            <p className="text-sm text-neutral-500">
              {isSigned ? "Signed" : "Signature required"}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-neutral-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-neutral-100 p-4 space-y-4">
          {/* Waiver content */}
          <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-lg p-4 bg-neutral-50">
            <div
              className="prose prose-sm max-w-none text-neutral-700"
              dangerouslySetInnerHTML={{ __html: waiver.content }}
            />
          </div>

          {/* Agreement checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id={`waiver-agree-${waiver.id}`}
              checked={agreed}
              onChange={(e) => handleAgreeChange(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <label
              htmlFor={`waiver-agree-${waiver.id}`}
              className="text-sm text-neutral-700"
            >
              I, <strong>{signerName || "[Your Name]"}</strong>, have read and
              agree to the terms outlined above.
            </label>
          </div>

          {/* Signature pad */}
          {agreed && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Your Signature
              </label>
              <SignatureCanvas
                onSignatureChange={handleSignatureUpdate}
                height={120}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Signed confirmation */}
          {isSigned && signatureData && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Waiver signed successfully
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Container component for multiple waivers
interface WaiverSignaturesContainerProps {
  waivers: WaiverTemplate[];
  signerName: string;
  signatures: Record<string, string>; // waiverId -> signatureData
  onSignaturesChange: (signatures: Record<string, string>) => void;
  errors?: Record<string, string>;
}

export function WaiverSignaturesContainer({
  waivers,
  signerName,
  signatures,
  onSignaturesChange,
  errors = {},
}: WaiverSignaturesContainerProps) {
  const handleSign = useCallback(
    (waiverId: string, signatureData: string) => {
      onSignaturesChange({
        ...signatures,
        [waiverId]: signatureData,
      });
    },
    [signatures, onSignaturesChange]
  );

  const handleUnsign = useCallback(
    (waiverId: string) => {
      const newSignatures = { ...signatures };
      delete newSignatures[waiverId];
      onSignaturesChange(newSignatures);
    },
    [signatures, onSignaturesChange]
  );

  if (waivers.length === 0) {
    return null;
  }

  const requiredCount = waivers.filter((w) => w.isRequired).length;
  const signedCount = Object.keys(signatures).length;
  const requiredSigned = waivers.filter(
    (w) => w.isRequired && signatures[w.id]
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold uppercase tracking-wide text-black">
          Waivers & Agreements
        </h2>
        <span className="text-sm text-neutral-500">
          {requiredSigned}/{requiredCount} required signed
        </span>
      </div>

      <div className="space-y-3">
        {waivers.map((waiver) => (
          <WaiverSignature
            key={waiver.id}
            waiver={waiver}
            signerName={signerName}
            onSign={handleSign}
            onUnsign={handleUnsign}
            isSigned={!!signatures[waiver.id]}
            signatureData={signatures[waiver.id]}
            error={errors[waiver.id]}
          />
        ))}
      </div>
    </div>
  );
}
