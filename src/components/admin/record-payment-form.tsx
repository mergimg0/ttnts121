"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Loader2, Banknote, Building2 } from "lucide-react";
import { formatPrice } from "@/lib/booking-utils";

interface RecordPaymentFormProps {
  bookingId: string;
  bookingRef: string;
  totalAmount: number; // in pence
  paidAmount?: number; // in pence
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecordPaymentForm({
  bookingId,
  bookingRef,
  totalAmount,
  paidAmount = 0,
  onSuccess,
  onCancel,
}: RecordPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: ((totalAmount - paidAmount) / 100).toString(), // Convert to pounds for display
    method: "cash" as "cash" | "bank_transfer",
    notes: "",
    dateReceived: new Date().toISOString().split("T")[0],
  });

  const remainingAmount = totalAmount - paidAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amountInPence = Math.round(parseFloat(formData.amount) * 100);

      if (isNaN(amountInPence) || amountInPence <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const response = await fetch("/api/admin/payments/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount: amountInPence,
          method: formData.method,
          notes: formData.notes || undefined,
          dateReceived: formData.dateReceived,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to record payment");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminCard hover={false}>
      <h3 className="text-[15px] font-semibold text-neutral-900 mb-4">
        Record Payment
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Booking Info */}
        <div className="p-3 bg-neutral-50 rounded-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            Booking Reference
          </p>
          <p className="font-mono text-sm text-neutral-900">{bookingRef}</p>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-neutral-500">Total:</span>
            <span className="font-medium">{formatPrice(totalAmount)}</span>
          </div>
          {paidAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Already paid:</span>
              <span className="text-green-600">{formatPrice(paidAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium">
            <span className="text-neutral-500">Remaining:</span>
            <span className="text-neutral-900">{formatPrice(remainingAmount)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, method: "cash" })}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                formData.method === "cash"
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <Banknote className="h-5 w-5" />
              <span className="text-sm font-medium">Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, method: "bank_transfer" })}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                formData.method === "bank_transfer"
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">Bank Transfer</span>
            </button>
          </div>
        </div>

        {/* Amount */}
        <AdminInput
          label="Amount (GBP)"
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          leftIcon={<span className="text-sm font-medium">£</span>}
          required
        />

        {/* Date Received */}
        <AdminInput
          label="Date Received"
          type="date"
          value={formData.dateReceived}
          onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
          required
        />

        {/* Notes */}
        <AdminTextarea
          label="Notes (Optional)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g., Payment received at session, reference number..."
          rows={3}
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
                Recording...
              </>
            ) : (
              "Record Payment"
            )}
          </Button>
        </div>
      </form>
    </AdminCard>
  );
}
