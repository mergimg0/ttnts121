"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Loader2, Link2, CheckCircle, Copy, ExternalLink } from "lucide-react";

interface PaymentLinkFormProps {
  // Pre-fill for booking-specific links
  bookingId?: string;
  customerEmail?: string;
  customerName?: string;
  suggestedAmount?: number; // in pence
  suggestedDescription?: string;
  onSuccess?: (paymentLinkUrl: string) => void;
  onCancel?: () => void;
}

export function PaymentLinkForm({
  bookingId,
  customerEmail: initialEmail = "",
  customerName: initialName = "",
  suggestedAmount,
  suggestedDescription = "",
  onSuccess,
  onCancel,
}: PaymentLinkFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    customerEmail: initialEmail,
    customerName: initialName,
    amount: suggestedAmount ? (suggestedAmount / 100).toString() : "",
    description: suggestedDescription,
    expiryDays: "7",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amountInPence = Math.round(parseFloat(formData.amount) * 100);

      if (isNaN(amountInPence) || amountInPence <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!formData.customerEmail) {
        throw new Error("Please enter a customer email");
      }

      if (!formData.description.trim()) {
        throw new Error("Please enter a description");
      }

      const response = await fetch("/api/admin/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: formData.customerEmail,
          customerName: formData.customerName || undefined,
          amount: amountInPence,
          description: formData.description,
          bookingId: bookingId || undefined,
          expiryDays: parseInt(formData.expiryDays),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create payment link");
      }

      setPaymentLinkUrl(data.data.stripePaymentLinkUrl);
      setSuccess(true);
      onSuccess?.(data.data.stripePaymentLinkUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentLinkUrl) return;

    try {
      await navigator.clipboard.writeText(paymentLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = paymentLinkUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (success && paymentLinkUrl) {
    return (
      <AdminCard hover={false}>
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-[15px] font-semibold text-neutral-900 mb-2">
            Payment Link Created
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            The link has been emailed to {formData.customerEmail}
          </p>

          <div className="bg-neutral-50 rounded-lg p-3 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Payment Link
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paymentLinkUrl}
                readOnly
                className="flex-1 text-xs bg-white border border-neutral-200 rounded px-3 py-2 font-mono truncate"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(paymentLinkUrl, "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setPaymentLinkUrl(null);
                setFormData({
                  customerEmail: "",
                  customerName: "",
                  amount: "",
                  description: "",
                  expiryDays: "7",
                });
              }}
              className="flex-1"
            >
              Create Another
            </Button>
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-black hover:bg-neutral-800"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard hover={false}>
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900 mb-4">
        <Link2 className="h-4 w-4 text-neutral-400" />
        Create Payment Link
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Email */}
        <AdminInput
          label="Customer Email"
          type="email"
          value={formData.customerEmail}
          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          placeholder="customer@example.com"
          required
        />

        {/* Customer Name */}
        <AdminInput
          label="Customer Name (Optional)"
          type="text"
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          placeholder="John Smith"
        />

        {/* Amount */}
        <AdminInput
          label="Amount (GBP)"
          type="number"
          step="0.01"
          min="0.50"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          leftIcon={<span className="text-sm font-medium">£</span>}
          hint="Minimum amount is £0.50"
          required
        />

        {/* Description */}
        <AdminTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., After School Football Club - Spring 2024"
          rows={2}
          required
        />

        {/* Expiry */}
        <AdminSelect
          label="Link Expiry"
          value={formData.expiryDays}
          onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
          options={[
            { value: "1", label: "1 day" },
            { value: "3", label: "3 days" },
            { value: "7", label: "7 days" },
            { value: "14", label: "14 days" },
            { value: "30", label: "30 days" },
          ]}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-black hover:bg-neutral-800"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create & Send Link"
            )}
          </Button>
        </div>
      </form>
    </AdminCard>
  );
}
