"use client";

import { ExternalLink } from "lucide-react";
import { PaymentRecord } from "@/types/stripe";
import { PaymentStatusBadge } from "./payment-status-badge";
import { formatPrice } from "@/lib/booking-utils";

interface PaymentTableProps {
  payments: PaymentRecord[];
  loading?: boolean;
}

export function PaymentTable({ payments, loading }: PaymentTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500 text-sm">No payments found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Customer
            </th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 hidden sm:table-cell">
              Date
            </th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Status
            </th>
            <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              className="group hover:bg-neutral-50/50 transition-colors"
            >
              <td className="py-4 px-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {payment.customerName || 'Guest'}
                  </p>
                  <p className="text-[13px] text-neutral-500 truncate max-w-[180px]">
                    {payment.customerEmail || 'No email'}
                  </p>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm font-semibold tabular-nums text-neutral-900">
                  {formatPrice(payment.amount)}
                </span>
              </td>
              <td className="py-4 px-4 hidden sm:table-cell">
                <span className="text-sm text-neutral-600">
                  {new Date(payment.created * 1000).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-[13px] text-neutral-400 ml-2">
                  {new Date(payment.created * 1000).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </td>
              <td className="py-4 px-4">
                <PaymentStatusBadge status={payment.status} />
              </td>
              <td className="py-4 px-4 text-right">
                <a
                  href={payment.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-400 hover:text-sky-600 transition-colors"
                >
                  <span className="hidden sm:inline">View</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
