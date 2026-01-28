"use client";

import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { CreditCard, Banknote, Building2, Link2, Clock } from "lucide-react";
import { formatPrice } from "@/lib/booking-utils";
import { PaymentMethod, PaymentStatus, PaymentHistoryItem } from "@/types/payment";

interface PaymentHistoryProps {
  payments: PaymentHistoryItem[];
  totalAmount: number; // in pence
  showSummary?: boolean;
}

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  cash: <Banknote className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
  payment_link: <Link2 className="h-4 w-4" />,
};

const methodLabels: Record<PaymentMethod, string> = {
  card: "Card",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  payment_link: "Payment Link",
};

const statusVariants: Record<PaymentStatus, "success" | "warning" | "error" | "info"> = {
  paid: "success",
  pending: "warning",
  partial: "info",
  failed: "error",
  refunded: "info",
};

function formatDate(date: any): string {
  if (!date) return "-";
  const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: any): string {
  if (!date) return "-";
  const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentHistory({ payments, totalAmount, showSummary = true }: PaymentHistoryProps) {
  // Calculate totals
  const paidAmount = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingAmount = totalAmount - paidAmount;
  const overallStatus = paidAmount >= totalAmount
    ? "paid"
    : paidAmount > 0
      ? "partial"
      : "unpaid";

  if (payments.length === 0 && !showSummary) {
    return (
      <div className="text-center py-8 text-neutral-500 text-sm">
        No payment history
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {showSummary && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-xl">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Total
            </p>
            <p className="text-lg font-semibold tabular-nums text-neutral-900">
              {formatPrice(totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Paid
            </p>
            <p className="text-lg font-semibold tabular-nums text-green-600">
              {formatPrice(paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              {remainingAmount >= 0 ? "Remaining" : "Overpaid"}
            </p>
            <p className={`text-lg font-semibold tabular-nums ${remainingAmount > 0 ? "text-amber-600" : remainingAmount < 0 ? "text-blue-600" : "text-neutral-400"}`}>
              {formatPrice(Math.abs(remainingAmount))}
            </p>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Payment History
          </h4>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    payment.status === "paid"
                      ? "bg-green-100 text-green-600"
                      : payment.status === "pending"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {methodIcons[payment.method]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {methodLabels[payment.method]}
                      </span>
                      <AdminBadge variant={statusVariants[payment.status]}>
                        {payment.status}
                      </AdminBadge>
                    </div>
                    <p className="text-[12px] text-neutral-500">
                      {formatDateTime(payment.date)}
                      {payment.recordedBy && (
                        <span className="ml-2 text-neutral-400">
                          by {payment.recordedBy}
                        </span>
                      )}
                    </p>
                    {payment.notes && (
                      <p className="text-[12px] text-neutral-400 mt-1 italic">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-neutral-900">
                    {formatPrice(payment.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {payments.length === 0 && (
        <div className="text-center py-6 text-neutral-500">
          <Clock className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
          <p className="text-sm">No payments recorded yet</p>
        </div>
      )}
    </div>
  );
}
